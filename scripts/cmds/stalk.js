const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "stalk",
    aliases: ["info", "profile"],
    version: "1.0.0",
    author: "Jin",
    countDown: 5,
    role: 1, // Admin and above
    description: {
      en: "Get detailed information about a Facebook user profile"
    },
    category: "info",
    guide: {
      en: "{pn} @tag | {pn} <uid> | {pn} <profile link> | reply to a message"
    }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    let uid;
    if (event.type === "message_reply") {
      uid = event.messageReply.senderID;
    } else if (Object.keys(event.mentions).length > 0) {
      uid = Object.keys(event.mentions)[0];
    } else if (args[0]) {
      if (/^\d+$/.test(args[0])) {
        uid = args[0];
      } else {
        try {
          uid = await global.utils.findUid(args[0]);
        } catch (e) {
          return message.reply("❌ Invalid profile link or UID.");
        }
      }
    } else {
      uid = event.senderID;
    }

    if (!uid) return message.reply("❌ Could not determine the UID of the user.");

    message.reaction("🔍", event.messageID);

    try {
      // Use usePayload = false to get extended info from profile page parsing
      const user = await api.getUserInfo(uid, false);
      if (!user) {
        return message.reply("❌ Unable to fetch profile information from Facebook.");
      }

      const avatarUrl = await usersData.getAvatarUrl(uid);
      
      let msg = `👤 PROFILE INFORMATION\n`;
      msg += `━━━━━━━━━━━━━━━━━━\n`;
      msg += `📝 Name: ${user.name || "N/A"}\n`;
      msg += `🆔 Username: ${user.vanity || "N/A"}\n`;
      msg += `🔢 UID: ${uid}\n`;
      msg += `👫 Gender: ${user.gender || "Unknown"}\n`;
      msg += `💍 Relationship: ${user.relationship_status || "N/A"}\n`;
      msg += `🎂 Birthday: ${user.isBirthday ? "Today! 🎂" : "N/A"}\n`;
      msg += `📍 Lives in: ${user.live_city || "N/A"}\n`;
      msg += `📖 Bio: ${user.bio || "N/A"}\n`;
      msg += `📰 Headline: ${user.headline || "N/A"}\n`;
      msg += `👥 Followers: ${user.followers || "N/A"}\n`;
      msg += `👤 Following: ${user.following || "N/A"}\n`;
      msg += `🛡️ Verified: ${user.isVerified ? "Yes ✅" : "No"}\n`;
      msg += `🔗 Profile Link: ${user.profileUrl || `https://facebook.com/${uid}`}\n`;
      msg += `━━━━━━━━━━━━━━━━━━`;

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const avatarPath = path.join(cacheDir, `avatar_${uid}.png`);

      if (avatarUrl) {
        const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(avatarPath, Buffer.from(response.data));
        
        const attachments = [fs.createReadStream(avatarPath)];
        
        // If cover photo is available, add it too
        if (user.coverPhoto) {
          try {
            const coverPath = path.join(cacheDir, `cover_${uid}.png`);
            const coverRes = await axios.get(user.coverPhoto, { responseType: 'arraybuffer' });
            await fs.writeFile(coverPath, Buffer.from(coverRes.data));
            attachments.push(fs.createReadStream(coverPath));
            // Cleanup cover photo later
            setTimeout(() => fs.unlink(coverPath).catch(() => {}), 10000);
          } catch (e) {
            console.error("Cover fetch error:", e);
          }
        }

        await message.reply({
          body: msg,
          attachment: attachments
        });
        
        fs.unlink(avatarPath).catch(() => {});
      } else {
        await message.reply(msg);
      }

      message.reaction("✅", event.messageID);

    } catch (error) {
      console.error("Stalk Error:", error);
      message.reply("❌ An error occurred while fetching profile info.");
      message.reaction("❌", event.messageID);
    }
  }
};
