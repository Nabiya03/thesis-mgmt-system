const User = require("../models/user.model");

module.exports = function checkDailyQuota(type, maxPerDay) {
  return async (req, res, next) => {
    const user = await User.findById(req.user.id);
    const today = new Date().toDateString();

    if (!user.aiUsage || user.aiUsage.date?.toDateString() !== today) {
      user.aiUsage = { date: new Date(), tasksUsed: 0, chatsUsed: 0 };
    }

    if (user.aiUsage[`${type}Used`] >= maxPerDay) {
      return res.status(403).json({ error: `Daily ${type} usage limit reached.` });
    }

    user.aiUsage[`${type}Used`] += 1;
    await user.save();
    next();
  };
};
