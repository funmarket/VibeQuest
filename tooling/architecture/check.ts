import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { dependencyCycles, resolveSourceImport } from "./graph";
import { foreignTables } from "./database-ownership";

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    () => [],
  );
  const result: string[] = [];
  for (const entry of entries) {
    if (["node_modules", ".next", "dist", ".git"].includes(entry.name))
      continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await files(full)));
    else result.push(full);
  }
  return result;
}

export async function checkArchitecture(root: string): Promise<string[]> {
  const errors: string[] = [];
  const all = [
    ...(await files(path.join(root, "apps"))),
    ...(await files(path.join(root, "packages"))),
  ];
  const manifests = new Map<string, Set<string>>();
  const packageNames = new Map<string, string>();
  const packageGraph = new Map<string, Set<string>>();
  const sourceGraph = new Map<string, Set<string>>();
  const available = new Set(all.map((file) => file.replaceAll("\\", "/")));
  const configurations = new Map<string, ts.CompilerOptions>();
  function optionsFor(file: string) {
    const config = ts.findConfigFile(path.dirname(file), ts.sys.fileExists);
    if (
      !config ||
      !path.resolve(config).startsWith(path.resolve(root) + path.sep)
    )
      return { moduleResolution: ts.ModuleResolutionKind.Bundler };
    if (!configurations.has(config)) {
      const input = ts.readConfigFile(config, ts.sys.readFile);
      if (input.error) {
        errors.push(
          `${path.relative(root, config)}: unreadable TypeScript configuration`,
        );
        configurations.set(config, {});
      } else {
        configurations.set(
          config,
          ts.parseJsonConfigFileContent(
            input.config,
            ts.sys,
            path.dirname(config),
          ).options,
        );
      }
    }
    return configurations.get(config)!;
  }
  for (const file of all.filter(
    (file) => path.basename(file) === "package.json",
  )) {
    const manifest = JSON.parse(await readFile(file, "utf8"));
    packageNames.set(path.dirname(file), manifest.name);
    manifests.set(
      path.dirname(file),
      new Set(
        Object.keys({
          ...manifest.dependencies,
          ...manifest.devDependencies,
          ...manifest.peerDependencies,
        }),
      ),
    );
  }
  for (const [directory, dependencies] of manifests)
    packageGraph.set(packageNames.get(directory)!, dependencies);
  const serverPackages = new Set(["@vq/api", "@vq/database", "@vq/domain"]);
  for (const [directory, name] of packageNames)
    if (
      all.some(
        (file) =>
          file.startsWith(directory + path.sep) &&
          /[\\/]src[\\/](?:.*[\\/])?(domain|application)[\\/]/.test(file),
      )
    )
      serverPackages.add(name);
  for (const file of all.filter(
    (file) => /\.[cm]?[jt]sx?$/.test(file) && !file.endsWith(".d.ts"),
  )) {
    const owner = [...manifests.keys()]
      .filter((dir) => file.startsWith(dir + path.sep))
      .sort((a, b) => b.length - a.length)[0];
    if (!owner) continue;
    const relative = path.relative(root, file).replaceAll("\\", "/");
    const fileKey = file.replaceAll("\\", "/");
    sourceGraph.set(fileKey, new Set());
    const source = ts.createSourceFile(
      file,
      await readFile(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const imports: string[] = [];
    const databaseOwner = relative.match(
      /^packages\/database\/src\/([^/]+)\//,
    )?.[1];
    const databaseComposition = relative === "packages/database/src/index.ts";
    function visit(node: ts.Node) {
      if (databaseOwner || databaseComposition) {
        const text = ts.isStringLiteralLike(node)
          ? node.text
          : ts.isTemplateExpression(node)
            ? node.head.text +
              node.templateSpans.map((span) => " " + span.literal.text).join("")
            : undefined;
        if (
          text &&
          databaseComposition &&
          foreignTables("composition", text).length &&
          !/^\s*SELECT[\s\S]*\bLIMIT\s+0\s*;?\s*$/i.test(text)
        )
          errors.push(
            `${relative}: business query in database composition root`,
          );
        if (text && databaseOwner)
          for (const table of foreignTables(databaseOwner, text))
            errors.push(
              `${relative}: cross-domain database table access ${table}`,
            );
      }
      if (
        ts.isImportTypeNode(node) &&
        ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteral(node.argument.literal)
      )
        imports.push(node.argument.literal.text);
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        imports.push(node.moduleSpecifier.text);
      if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) &&
            node.expression.text === "require"))
      ) {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteralLike(argument))
          imports.push(argument.text);
        else
          errors.push(
            `${relative}: computed module import cannot prove ownership`,
          );
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    const compilerOptions = optionsFor(file);
    for (const specifier of imports) {
      const module = ts.resolveModuleName(
        specifier,
        file,
        compilerOptions,
        ts.sys,
      ).resolvedModule;
      const resolvedModule = module?.resolvedFileName.replaceAll("\\", "/");
      if (resolvedModule && available.has(resolvedModule))
        sourceGraph.get(fileKey)!.add(resolvedModule);
      const alias = Object.keys(compilerOptions.paths ?? {}).some((pattern) => {
        const star = pattern.indexOf("*");
        return star < 0
          ? pattern === specifier
          : specifier.startsWith(pattern.slice(0, star)) &&
              specifier.endsWith(pattern.slice(star + 1));
      });
      if (alias && !resolvedModule)
        errors.push(`${relative}: unresolved TypeScript alias ${specifier}`);
      if (specifier.startsWith(".") || (alias && resolvedModule)) {
        const target = alias
          ? path.resolve(module!.resolvedFileName)
          : path.resolve(path.dirname(file), specifier);
        const targetRelative = path
          .relative(root, target)
          .replaceAll("\\", "/");
        const targetDatabaseOwner = targetRelative.match(
          /^packages\/database\/src\/([^/]+)\//,
        )?.[1];
        if (
          databaseOwner &&
          targetDatabaseOwner &&
          databaseOwner !== targetDatabaseOwner
        )
          errors.push(
            `${relative}: cross-domain database adapter access ${specifier}`,
          );
        const resolved = resolveSourceImport(
          target.replaceAll("\\", "/"),
          available,
        );
        if (resolved) sourceGraph.get(fileKey)!.add(resolved);
        if (
          relative.includes("/application/") &&
          (targetRelative.includes("/infrastructure/") ||
            targetRelative.startsWith("packages/database/") ||
            /\/http(?:\.[cm]?[jt]sx?)?$/.test(targetRelative))
        )
          errors.push(
            `${relative}: application infrastructure access ${specifier}`,
          );
        if (
          relative.startsWith("packages/contracts/") &&
          !targetRelative.startsWith("packages/contracts/")
        )
          errors.push(
            `${relative}: shared contract layer violation ${specifier}`,
          );
        if (
          relative.startsWith("apps/web/") &&
          (targetRelative.startsWith("packages/database/") ||
            targetRelative.startsWith("apps/api/"))
        )
          errors.push(
            `${relative}: browser database access through ${specifier}`,
          );
        if (!target.startsWith(owner + path.sep))
          errors.push(
            `${relative}: private workspace implementation import ${specifier}`,
          );
        const domainPrefix = relative.includes("/domain/")
          ? relative.split("/domain/")[0] + "/domain/"
          : undefined;
        if (domainPrefix && !targetRelative.startsWith(domainPrefix))
          errors.push(
            `${relative}: pure domain imports private layer ${specifier}`,
          );
        const modulePrefix = relative.match(
          /^(apps\/api\/src\/modules\/[^/]+)\//,
        )?.[1];
        if (
          modulePrefix &&
          targetRelative.startsWith("apps/api/src/modules/") &&
          !targetRelative.startsWith(modulePrefix + "/")
        )
          errors.push(`${relative}: cross-domain private access ${specifier}`);
        continue;
      }
      if (specifier.startsWith("node:")) {
        if (relative.includes("/domain/"))
          errors.push(
            `${relative}: pure domain imports Node infrastructure ${specifier}`,
          );
        if (relative.includes("/application/"))
          errors.push(
            `${relative}: application infrastructure access ${specifier}`,
          );
        continue;
      }
      const packageName = specifier.startsWith("@")
        ? specifier.split("/").slice(0, 2).join("/")
        : specifier.split("/")[0];
      if (
        relative.includes("/application/") &&
        [
          "@vq/database",
          "pg",
          "drizzle-orm",
          "fastify",
          "next",
          "react",
        ].includes(packageName)
      )
        errors.push(
          `${relative}: application infrastructure access ${specifier}`,
        );
      if (relative.startsWith("packages/contracts/") && packageName !== "zod")
        errors.push(
          `${relative}: shared contract layer violation ${specifier}`,
        );
      if (relative.startsWith("apps/web/") && serverPackages.has(packageName))
        errors.push(`${relative}: browser server-layer access ${specifier}`);
      if (!manifests.get(owner)?.has(packageName))
        errors.push(`${relative}: undeclared dependency ${packageName}`);
      if (
        relative.startsWith("apps/web/") &&
        ["@vq/database", "pg", "drizzle-orm"].includes(packageName)
      )
        errors.push(`${relative}: browser database access`);
      if (
        relative.includes("/domain/") &&
        !["@vq/contracts"].includes(packageName)
      )
        errors.push(`${relative}: pure domain imports ${packageName}`);
      if (specifier.includes("/src/") && specifier.startsWith("@vq/"))
        errors.push(`${relative}: private workspace implementation import`);
    }
  }
  for (const cycle of dependencyCycles(packageGraph))
    errors.push(`circular package dependency: ${cycle.join(" -> ")}`);
  for (const cycle of dependencyCycles(sourceGraph))
    errors.push(
      `circular source dependency: ${cycle.map((file) => path.relative(root, file).replaceAll("\\", "/")).join(" -> ")}`,
    );
  return errors;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const errors = await checkArchitecture(process.cwd());
  if (errors.length) {
    process.stderr.write(errors.join("\n") + "\n");
    process.exitCode = 1;
  } else process.stdout.write("Architecture boundaries passed.\n");
}
