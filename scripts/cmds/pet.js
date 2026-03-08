
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "pet",
    aliases: ["pets", "mypet"],
    version: "1.0.1",
    author: "Rika",
    countDown: 5,
    role: 0,
    description: {
      en: "Claim someone as your pet, view pets, or see who owns someone."
    },
    category: "fun",
    guide: {
      en: "{pn} add @tag/uid | {pn} list | {pn} remove @tag/uid | {pn} info @tag/uid"
    }
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    const { senderID, mentions, messageReply } = event;
    const action = args[0]?.toLowerCase();

    if (!action) {
      return message.reply("🐾 [ RIKA PET SYSTEM ] 🐾\n━━━━━━━━━━━━━━━━━━\nUsage:\n^pet add @tag - Claim a pet\n^pet list - View your pets\n^pet remove @tag - Release a pet\n^pet info @tag - See who owns them\n━━━━━━━━━━━━━━━━━━");
    }

    // --- Helper to get Target ---
    const getTarget = async () => {
      if (messageReply) return messageReply.senderID;
      if (Object.keys(mentions).length > 0) {
        const botID = api.getCurrentUserID();
        const target = Object.keys(mentions).find(id => id != botID);
        return target || Object.keys(mentions)[0]; 
      }
      if (args[1] && !isNaN(args[1])) return args[1];
      return null;
    };

    switch (action) {
      case "add": {
        const targetID = await getTarget();

        if (!targetID) {
          return message.reply("❌ [ RIKA ]\nPlease tag the user or provide their UID to make them your pet.");
        }

        if (targetID == senderID) return message.reply("😅 You can't pet yourself!");
        if (targetID == api.getCurrentUserID()) return message.reply("😠 I'm your master, not your pet!");

        let userData = await usersData.get(senderID);
        if (!userData.data) userData.data = {};
        if (!userData.data.pets) userData.data.pets = [];

        if (userData.data.pets.includes(targetID)) {
          const name = await usersData.getName(targetID) || "User";
          return message.reply(`📝 ${name} is already in your pet collection!`);
        }

        userData.data.pets.push(targetID);
        await usersData.set(senderID, userData.data, "data");

        const targetName = await usersData.getName(targetID) || "This user";
        return message.reply(`✨ [ RIKA ] ✨\n━━━━━━━━━━━━━━━━━━\nSuccess! ${targetName} is now your pet.\nIdentity: ${targetID}\n━━━━━━━━━━━━━━━━━━`);
      }

      case "list":
      case "view": {
        const userData = await usersData.get(senderID);
        const pets = userData.data?.pets || [];

        if (pets.length === 0) {
          return message.reply("🐾 [ RIKA ]\nYou have no pets at the moment.");
        }

        let msg = "🐾 [ YOUR PETS ] 🐾\n━━━━━━━━━━━━━━━━━━\n";
        for (let i = 0; i < pets.length; i++) {
          const name = await usersData.getName(pets[i]) || "Unknown User";
          msg += `${i + 1}. ${name}\n🆔 ${pets[i]}\n\n`;
        }
        msg += "━━━━━━━━━━━━━━━━━━";
        return message.reply(msg);
      }

      case "info":
      case "check": {
        const targetID = await getTarget() || senderID;
        const targetName = await usersData.getName(targetID) || "User";
        
        const allUsers = await usersData.getAll();
        const owners = allUsers.filter(u => u.data?.pets?.includes(targetID));

        if (owners.length === 0) {
          return message.reply(`🍃 [ RIKA ]\n${targetName} is a free soul. They have no owners.`);
        }

        let msg = `🔍 [ PET INFO ]\n━━━━━━━━━━━━━━━━━━\nUser: ${targetName}\nStatus: Owned\n\nOwners:\n`;
        for (let i = 0; i < owners.length; i++) {
          msg += `- ${owners[i].name} (${owners[i].userID})\n`;
        }
        msg += "━━━━━━━━━━━━━━━━━━";
        return message.reply(msg);
      }

      case "remove":
      case "release": {
        const targetID = await getTarget();
        if (!targetID) return message.reply("❌ Tag the pet you want to release.");

        let userData = await usersData.get(senderID);
        const pets = userData.data?.pets || [];
        const index = pets.indexOf(targetID);

        if (index === -1) return message.reply("❌ That user is not your pet.");

        pets.splice(index, 1);
        await usersData.set(senderID, userData.data, "data");

        const name = await usersData.getName(targetID) || "User";
        return message.reply(`🍃 [ RIKA ]\nYou have released ${name}. They are free now!`);
      }

      default:
        return message.reply("❌ Unknown subcommand. Use ^pet add, list, remove, or info.");
    }
  }
};
