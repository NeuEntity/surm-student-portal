import assert from "node:assert";
import { validateUserCreation, canManageUsers, CreateUserData } from "@/lib/permissions";

console.log("Running Permission Validation Tests...");

// Test 1: Validate Required Fields
const validAdmin: CreateUserData = {
  name: "Admin User",
  email: "admin@test.com",
  password: "password123",
  role: "ADMIN"
};

const result1 = validateUserCreation(validAdmin);
assert.strictEqual(result1.valid, true, "Valid admin should pass");

const missingField: any = {
  name: "Incomplete User",
  email: "incomplete@test.com",
  role: "ADMIN"
};

const result2 = validateUserCreation(missingField);
assert.strictEqual(result2.valid, false, "Missing password should fail");
assert.strictEqual(result2.error, "Missing required fields");

// Test 2: Validate Student Requirements
const validStudent: CreateUserData = {
  name: "Student User",
  email: "student@test.com",
  password: "password123",
  role: "STUDENT",
  level: "SECONDARY_1"
};

const result3 = validateUserCreation(validStudent);
assert.strictEqual(result3.valid, true, "Valid student with level should pass");

const invalidStudent: CreateUserData = {
  name: "Invalid Student",
  email: "invalid@test.com",
  password: "password123",
  role: "STUDENT"
  // Missing level
};

const result4 = validateUserCreation(invalidStudent);
assert.strictEqual(result4.valid, false, "Student without level should fail");
assert.strictEqual(result4.error, "Students must have a level assigned");

// Test 3: Admin Access Control
assert.strictEqual(canManageUsers("ADMIN"), true, "Admin should be able to manage users");
assert.strictEqual(canManageUsers("TEACHER"), false, "Teacher should not be able to manage users");
assert.strictEqual(canManageUsers("STUDENT"), false, "Student should not be able to manage users");
assert.strictEqual(canManageUsers(undefined), false, "Undefined role should not be able to manage users");

console.log("All Permission Validation Tests Passed!");
