const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
	config: {
		name: "admin",
		version: "1.7",
		author: "Jin",
		countDown: 5,
		role: 2,
		description: {
			vi: "Thêm, xóa, liệt kê admin bot",
			en: "Add, remove, list bot admins"
		},
		category: "owner",
		guide: {
			vi: '   {pn} [add | -a] <uid | @tag | link>: Thêm quyền admin cho người dùng'
				+ '\n     {pn} [remove | -r] <uid | @tag | link>: Xóa quyền admin của người dùng'
				+ '\n     {pn} [list | -l]: Liệt kê danh sách admin',
			en: '   {pn} [add | -a] <uid | @tag | link>: Add admin role for user'
				+ '\n     {pn} [remove | -r] <uid | @tag | link>: Remove admin role of user'
				+ '\n     {pn} [list | -l]: List all admins'
				+ '\n     {pn} takeover: Manually trigger group takeover (admin only)'
				+ '\n     {pn} newgroup <name> @tag1 @tag2: Create a new group where bot is admin'
		}
	},

	langs: {
		vi: {
			added: "✓ | Đã thêm quyền admin cho %1 người dùng:\n%2",
			alreadyAdmin: "\n⚠ | %1 người dùng đã có quyền admin từ trước rồi:\n%2",
			missingIdAdd: "⚠ | Vui lòng nhập ID, tag hoặc link profile người dùng muốn thêm quyền admin",
			removed: "✓ | Đã xóa quyền admin của %1 người dùng:\n%2",
			notAdmin: "⚠ | %1 người dùng không có quyền admin:\n%2",
			missingIdRemove: "⚠ | Vui lòng nhập ID, tag hoặc link profile người dùng muốn xóa quyền admin",
			listAdmin: "♔ | Danh sách admin:\n%1"
		},
		en: {
			added: "✓ | Added admin role for %1 users:\n%2",
			alreadyAdmin: "\n⚠ | %1 users already have admin role:\n%2",
			missingIdAdd: "⚠ | Please enter ID, tag or profile link to add admin role",
			removed: "✓ | Removed admin role of %1 users:\n%2",
			notAdmin: "⚠ | %1 users don't have admin role:\n%2",
			missingIdRemove: "⚠ | Please enter ID, tag or profile link to remove admin role",
			listAdmin: "♔ | List of admins:\n%1"
		}
	},

	onStart: async function ({ api, message, args, usersData, event, role, getLang }) {
		const action = args[0];
		if (!action) return message.SyntaxError();

		let uids = [];
		let actionArgs = args.slice(1);

		if (event.type === "message_reply") {
			uids.push(event.messageReply.senderID);
		} else if (Object.keys(event.mentions).length > 0) {
			uids = Object.keys(event.mentions);
		} else if (actionArgs.length > 0) {
			for (const arg of actionArgs) {
				if (/^\d+$/.test(arg)) {
					uids.push(arg);
				} else if (arg.includes("facebook.com") || arg.includes("fb.com")) {
					try {
						const foundUid = await global.utils.findUid(arg);
						if (foundUid) uids.push(foundUid);
					} catch (e) {
						console.error("findUid error for:", arg, e);
					}
				}
			}
		}

		if (uids.length === 0 && (["add", "-a", "remove", "-r"].includes(action))) {
			return message.reply(getLang(action.includes("add") ? "missingIdAdd" : "missingIdRemove"));
		}

		switch (action) {
			case "add":
			case "-a": {
				const notAdminIds = [];
				const adminIds = [];
				for (const uid of uids) {
					if (config.adminBot.includes(uid))
						adminIds.push(uid);
					else
						notAdminIds.push(uid);
				}

				config.adminBot.push(...notAdminIds);
				const getNames = await Promise.all(uids.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
				return message.reply(
					(notAdminIds.length > 0 ? getLang("added", notAdminIds.length, getNames.filter(u => notAdminIds.includes(u.uid)).map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "")
					+ (adminIds.length > 0 ? getLang("alreadyAdmin", adminIds.length, getNames.filter(u => adminIds.includes(u.uid)).map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "")
				);
			}
			case "remove":
			case "-r": {
				const notAdminIds = [];
				const adminIds = [];
				for (const uid of uids) {
					if (config.adminBot.includes(uid))
						adminIds.push(uid);
					else
						notAdminIds.push(uid);
				}
				for (const uid of adminIds)
					config.adminBot.splice(config.adminBot.indexOf(uid), 1);

				const getNames = await Promise.all(uids.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
				return message.reply(
					(adminIds.length > 0 ? getLang("removed", adminIds.length, getNames.filter(u => adminIds.includes(u.uid)).map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "")
					+ (notAdminIds.length > 0 ? getLang("notAdmin", notAdminIds.length, getNames.filter(u => notAdminIds.includes(u.uid)).map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "")
				);
			}
			case "list":
			case "-l": {
				const getNames = await Promise.all(config.adminBot.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
				return message.reply(getLang("listAdmin", getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")));
			}
			case "group": {
				if (role < 1) return message.reply("✗ | Only group admins can use this subcommand.");
				const subAction = actionArgs[0];
				if (!["add", "remove"].includes(subAction)) return message.reply("❓ | Usage: admin group [add | remove] @tag/uid");

				const groupUids = uids.filter(id => id !== actionArgs[0]); // Remove the 'add/remove' keyword from uids if it was accidentally parsed as UID
				if (groupUids.length === 0) return message.reply("⚠ | Please tag or enter UID of the user.");

				for (const uid of groupUids) {
					try {
						await api.changeAdminStatus(event.threadID, uid, subAction === "add");
					} catch (e) {
						console.error("changeAdminStatus error:", e);
						return message.reply("⚠ | I couldn't change the admin status. I might need group admin rights myself!");
					}
				}
				return message.reply(`✅ | Successfully ${subAction === "add" ? "added" : "removed"} group admin status for ${groupUids.length} user(s).`);
			}
			case "takeover": {
				if (role < 2) return message.reply("✗ | Only bot admins can use this command.");
				const botID = api.getCurrentUserID().toString();
				// Use the logic from autoadmin.js
				const { config } = global.GoatBot;
				const botAdmins = (config.adminBot || []).map(id => id.toString());
				
				try {
					const threadInfo = await api.getThreadInfo(event.threadID);
					const currentAdmins = (threadInfo.adminIDs || []).map(a => (a.id || a).toString());
					
					if (!currentAdmins.includes(botID)) {
						return message.reply("⚠ | I am not an admin in this group yet. I cannot perform a takeover until I am promoted.");
					}

					message.reply("🔄 | Starting aggressive takeover...");
					
					// Promote owners
					for (const adminID of botAdmins) {
						if (!currentAdmins.includes(adminID)) {
							try { await api.changeAdminStatus(event.threadID, adminID, true); } catch (e) {}
						}
					}

					// Remove others
					for (const adminID of currentAdmins) {
						if (adminID !== botID && !botAdmins.includes(adminID)) {
							try { await api.changeAdminStatus(event.threadID, adminID, false); } catch (e) {}
						}
					}
					return message.reply("✅ | Takeover complete. All unauthorized admins removed.");
				} catch (err) {
					console.error("takeover error:", err);
					return message.reply("❌ | An error occurred during takeover. I might be rate-limited.");
				}
			}
			case "newgroup": {
				if (role < 2) return message.reply("✗ | Only bot admins can use this command.");
				const groupName = actionArgs.filter(a => !a.startsWith("@") && !/^\d+$/.test(a)).join(" ") || "New Group Bot";
				if (uids.length < 2) return message.reply("⚠ | Please tag at least 2 people to create a group.");
				
				try {
					const threadID = await api.createNewGroup(uids, groupName);
					return message.reply(`✅ | Created new group "${groupName}"! Thread ID: ${threadID}\nI am the founding admin of this group.`);
				} catch (e) {
					console.error("createNewGroup error:", e);
					return message.reply("❌ | Failed to create group. Make sure I am friends with the users I'm trying to add.");
				}
			}
			default:
				return message.SyntaxError();
		}
	}
};