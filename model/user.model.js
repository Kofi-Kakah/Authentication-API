import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: true
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    isVerified: {
        type: Boolean,
        default: false
    },

    //Email verification
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    //Forgot / reset password
    passwordResetToken: String,
    passwordResetExpires: Date,

    //Optional: track when password was last changed (invalidate old JWTs)
    passwordChangedAt: Date,

}, { timestamps: true });

//Hash password before saving
userSchema.pre("save", async function () {
    if(!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

//Update passwordChangedAt when password changes (not on creation)
userSchema.pre("save", function () {
    if (!this.isModified("password") || this.isNew) return;
    this.passwordChangedAt = Date.now() - 1000; // ensure token issued after this
});

//Instance method: compare canditate password to hashed password
userSchema.methods.comparePassword = async function (canditatePassword) {
    return bcrypt.compare(canditatePassword, this.password);
};

//Instance method: generate email verification token
userSchema.methods.createEmailVerificationToken = function () {
    const rawToken = crypto.randomBytes(32).toString("hex");
    this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    return rawToken; // send the raw (unhashed) token via email
};

// Instance method: generate password reset token
userSchema.methods.createPasswordResetToken = function () {
    const rawToken = crypto.randomBytes(5).toString("hex");
    this.passwordResetToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
    this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 min
    return rawToken;
};

// Instance methods: check if password was changed after a JWT was issued
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
    if (!this.passwordChangedAt) return false;
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTimestamp;
}

const User = mongoose.model("User", userSchema);

export default User;