module.exports = {
	id: { type: String, unique: true, required: true },
	title: { type: String, required: true },
	artists: [{ type: String }],
	genres: [{ type: String }],
	duration: { type: Number, required: true },
	skipDuration: { type: Number, required: true },
	thumbnail: { type: String, required: true },
	requestedBy: { type: String, required: true },
	requestedAt: { type: Date, required: true }
};
