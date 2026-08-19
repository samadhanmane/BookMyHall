import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // super_admin, org_admin, coordinator, hod, workshop_hod, registrar, director, faculty, assistant, worker, canteen_owner
    role: { 
      type: String, 
      required: true,
      enum: ['super_admin', 'org_admin', 'coordinator', 'hod', 'workshop_hod', 'registrar', 'director', 'faculty', 'assistant', 'worker', 'canteen_owner', 'budget_hod']
    },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    department: String,
    phone: String,
    passwordHash: String // encrypted using bcrypt
  },
  { timestamps: true }
);

UserSchema.index({ organizationId: 1 });

export const User = mongoose.model("User", UserSchema);


