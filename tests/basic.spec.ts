require("dotenv").config();
import { test, expect } from '@playwright/test';
import { random, sample } from 'lodash';
import { getAllUsers } from '../backend/database';
import { TestContext } from 'node:test';
import { faker } from '@faker-js/faker'
import { existsSync } from 'fs';
import { randomInt } from 'crypto';
const defaultPassword = process.env.SEED_DEFAULT_USER_PASSWORD!;

const users = getAllUsers();
const user = sample(users)!;
test.beforeEach(async ({page,baseURL})=>{
  await page.goto('/');
  await expect(page).toHaveURL(baseURL!+'/signin')
})

async function fillLoginForm(page, username: string, password: string) {
  //await page.getByRole('textbox', { name: 'Username' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  
  //await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
}

test.describe("Login (random user) ",()=>{
  test('Login ui appears correctly',async ({page})=>{
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
  });

  test('Incorrect password fails',async ({page})=>{
    await fillLoginForm(page,user.username,'hmmmmmmmmmmmm')
    //await page.getByRole('textbox', { name: 'Password' }).press('Enter');
    await page.locator('[data-test="signin-submit"]').click();
    await expect(page.locator('[data-test="signin-error"]')).toBeVisible();
  });

  test('Correct password succeeds',async ({page})=>{
    await fillLoginForm(page,user.username,user.username+'_'+defaultPassword)
    //await page.getByRole('textbox', { name: 'Password' }).press('Enter');
    await page.locator('[data-test="signin-submit"]').click();
    await expect(page.locator('[data-test="main"]')).toBeVisible();
  });

  test('Retry login succeeds',async ({page})=>{
    await fillLoginForm(page,user.username,'hmmmmmmmmmmmm');
    await page.locator('[data-test="signin-submit"]').click();
    await expect(page.locator('[data-test="signin-error"]')).toBeVisible();

    await fillLoginForm(page,user.username,user.username+'_'+defaultPassword)
    await page.locator('[data-test="signin-submit"]').click();
    await expect(page.locator('[data-test="main"]')).toBeVisible();
  })
});

test.describe('Home page Tests',()=>{
  test.beforeEach(async ({page})=>{
    await fillLoginForm(page,user.username,user.username+'_'+defaultPassword);
    await page.locator('[data-test="signin-submit"]').click();
  })
  test('Editing user details',async  ({page,baseURL})=>{
    await page.locator('[data-test="sidenav-user-settings"]').click();
    await expect(page).toHaveURL(baseURL+'/user/settings');
    const buttonLocator = page.locator('[data-test="user-settings-submit"]');

    const assertValidity = async (locator: any, valid :string, invalid :string) =>{
      await locator.clear();
      await locator.fill(invalid);
      await expect(buttonLocator).toBeDisabled();
      await locator.fill(valid);
      await expect(buttonLocator).toBeEnabled();
    }
    do{
      let fieldLocator = page.locator('[data-test="user-settings-firstName-input"]')
      const firstName = faker.name.firstName();
      await assertValidity(fieldLocator,firstName,'');

      fieldLocator = page.locator('[data-test="user-settings-lastName-input"]')
      await assertValidity(fieldLocator,faker.name.lastName(),'');

      fieldLocator = page.locator('[data-test="user-settings-email-input"]')
      await assertValidity(fieldLocator,faker.internet.email(),'que?');

      fieldLocator =  page.locator('[data-test="user-settings-phoneNumber-input"]')
      await assertValidity(fieldLocator,faker.phone.phoneNumberFormat(),'NaN');

    } while (!await buttonLocator.isVisible());
  })
});
