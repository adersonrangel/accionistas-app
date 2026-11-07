import { Schema, model, models } from "mongoose";
import crypto from "crypto";

const userSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		passwordHash: { type: String, required: true },
		role: {
			type: String,
			required: true,
			enum: ["admin", "user"],
			default: "user",
		},
	},
	{ timestamps: true }
);

const User = models.User || model("User", userSchema);

const SALT_BYTES = 16;
const KEY_BYTES = 64;

// scrypt-based password hashing using only Node builtins (no new deps).
// Stored format: "<salt hex>:<hash hex>".
export function hashPassword(password: string): string {
	const salt = crypto.randomBytes(SALT_BYTES);
	const hash = crypto.scryptSync(password, salt, KEY_BYTES);
	return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
	const s = String(stored);
	const sep = s.indexOf(":");
	if (sep < 0) return false;
	const salt = Buffer.from(s.slice(0, sep), "hex");
	const hash = Buffer.from(s.slice(sep + 1), "hex");
	if (salt.length === 0 || hash.length === 0) return false;
	const actual = crypto.scryptSync(password, salt, hash.length);
	return actual.length === hash.length && crypto.timingSafeEqual(actual, hash);
}

// Public shape of a user document (never expose passwordHash).
export function toPublic(doc: any) {
	return {
		id: String(doc._id),
		username: doc.username,
		role: doc.role,
		createdAt: doc.createdAt,
	};
}

export async function findUserByName(username: string) {
	return User.findOne({ username: String(username).toLowerCase() }).lean();
}

export async function listUsers() {
	const docs = await User.find().sort({ createdAt: 1 }).lean();
	return docs.map(toPublic);
}

// Idempotent: creates the default admin (admin/admin) only if the
// collection is empty (mirrors the accionista seedIfEmpty pattern).
export async function seedIfEmpty() {
	const count = await User.countDocuments();
	if (count > 0) return { seeded: false };
	await User.create({
		username: "admin",
		passwordHash: hashPassword("admin"),
		role: "admin",
	});
	return { seeded: true, count: 1 };
}

export default User;