module.exports = {
	username: { type: String, required: true },
	admin: { type: Boolean, default: false,required: true },
	email: {
		verified: { type: Boolean, default: false, required: true },
		verificationToken: String,
		address: String
	},
	services: {
		password: {
			password: String
		}
	},
	ban: {
		banned: { type: Boolean, default: false, required: true },
		reason: String,
		bannedAt: Date,
		bannedUntil: Date
	},
	statistics: {
		songsRequested: { type: Number, default: 0, required: true },
		songsDisliked: [{ type: String, default: '', required: true }],
		songsLiked: [{ type: String, default: '', required: true }]
	},
	createdAt: { type: Date, default: Date.now() }
};