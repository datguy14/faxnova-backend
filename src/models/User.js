UserSchema.index({ createdAt: -1 });
UserSchema.index({ email: 1, status: 1 });
UserSchema.index({ plan: 1, createdAt: -1 });
