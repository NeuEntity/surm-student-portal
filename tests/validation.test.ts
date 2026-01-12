import assert from "node:assert";
import { validateICNumber, validateRequiredText, validateDateParts } from "@/lib/validation";

assert.strictEqual(validateRequiredText("John Doe"), true);
assert.strictEqual(validateRequiredText("   "), false);
assert.strictEqual(validateRequiredText(""), false);

assert.strictEqual(validateICNumber("123456789012"), true);
assert.strictEqual(validateICNumber("123456-78-9012"), true);
assert.strictEqual(validateICNumber("12345-78-9012"), false);
assert.strictEqual(validateICNumber("abcdef-12-3456"), false);

assert.strictEqual(validateDateParts("31", "1", "2025"), true);
assert.strictEqual(validateDateParts("31", "2", "2025"), false);
assert.strictEqual(validateDateParts("0", "1", "2025"), false);
assert.strictEqual(validateDateParts("15", "13", "2025"), false);
assert.strictEqual(validateDateParts("15", "10", "1800"), false);

console.log("All validation tests passed.");
