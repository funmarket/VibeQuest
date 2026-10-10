import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { createDatabase } from "../../packages/database/src/index";
test("business creation and membership survive reloads through real accounts", async ({
  browser,
}) => {
  test.setTimeout(90000);
  const database = createDatabase(
    "postgresql://vq_local@127.0.0.1:55439/vq_foundation",
  );
  const ownerContext = await browser.newContext();
  const memberContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  const member = await memberContext.newPage();
  const emails = [
    `business-browser-${randomUUID()}@example.test`,
    `business-browser-${randomUUID()}@example.test`,
  ];
  const name = `Chrome business fixture ${randomUUID().slice(0, 8)}`;
  async function register(page: Page, email: string) {
    await page.goto("http://127.0.0.1:3000/en/home");
    await page.getByRole("button", { name: "Your VibeQuest account" }).click();
    const menu = page.getByRole("dialog");
    await menu
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await menu.getByLabel("Email", { exact: true }).fill(email);
    await menu
      .getByLabel("Password", { exact: true })
      .fill("Real-business-browser!79");
    await menu.getByRole("button", { name: "Register", exact: true }).click();
    await expect(menu.getByText(email, { exact: true })).toBeVisible();
    await menu.getByText("Business management", { exact: true }).click();
  }
  try {
    await register(owner, emails[0]);
    await register(member, emails[1]);
    const memberId = await member
      .locator(".business-console output")
      .textContent();
    await owner.getByLabel("Business name", { exact: true }).fill(name);
    await owner
      .getByLabel("Business description", { exact: true })
      .fill("A real persisted fixture removed after verification.");
    await owner
      .getByRole("button", { name: "Create business", exact: true })
      .click();
    const card = owner.locator(".business-card").filter({ hasText: name });
    await expect(
      card.getByText("Approval pending", { exact: true }),
    ).toBeVisible();
    await card
      .getByLabel("Member's account ID", { exact: true })
      .fill(memberId!.trim());
    await card
      .getByRole("button", { name: "Invite member", exact: true })
      .click();
    await expect(
      card.getByText("Invitation saved. The invited account must accept it.", {
        exact: true,
      }),
    ).toBeVisible();
    await member.reload();
    await member
      .getByRole("button", { name: "Your VibeQuest account" })
      .click();
    await member.getByText("Business management", { exact: true }).click();
    await member
      .getByRole("button", { name: "Accept membership", exact: true })
      .click();
    await expect(
      member.getByRole("button", { name: "Accept membership", exact: true }),
    ).toHaveCount(0);
    await member.reload();
    await member
      .getByRole("button", { name: "Your VibeQuest account" })
      .click();
    await member.getByText("Business management", { exact: true }).click();
    await expect(
      member.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(
      member.getByRole("button", { name: "Invite member", exact: true }),
    ).toHaveCount(0);
    const rows = await database.pool.query(
      "SELECT o.status,m.status AS membership_status,m.role FROM business_organizations o JOIN business_memberships m ON m.organization_id=o.id WHERE o.name=$1 AND m.user_id=$2",
      [name, memberId!.trim()],
    );
    expect(rows.rows[0]).toEqual({
      status: "pending",
      membership_status: "active",
      role: "member",
    });
  } finally {
    await ownerContext.close();
    await memberContext.close();
    await database.pool.query(
      "DELETE FROM business_organizations WHERE owner_id IN (SELECT user_id FROM identity_password_accounts WHERE email=ANY($1::text[]))",
      [emails],
    );
    await database.pool.query(
      "DELETE FROM identity_users WHERE id IN (SELECT user_id FROM identity_password_accounts WHERE email=ANY($1::text[]))",
      [emails],
    );
    await database.close();
  }
});
