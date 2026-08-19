import { User } from "../models/User.js";

export const normalizeDepartment = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");

export const departmentMatches = (a, b) => {
  const x = normalizeDepartment(a);
  const y = normalizeDepartment(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
};

export const resolveUserDepartment = async (orgId, user) => {
  if (user?.department) return user.department;
  const userId = user?.sub || user?.id;
  let dbUser = null;
  if (userId) {
    dbUser = await User.findOne({ _id: userId, organizationId: orgId }).lean();
  }
  if (!dbUser && user?.email) {
    dbUser = await User.findOne({
      email: String(user.email).toLowerCase(),
      organizationId: orgId
    }).lean();
  }
  return dbUser?.department || "";
};
