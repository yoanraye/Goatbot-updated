const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "fak",
    aliases: ["fuck"],
    version: "1.1",
    author: "Jin",
    countDown: 20,
    role: 0, // Changed to 0 so everyone can use
    shortDescription: "f**k someone",
    longDescription: "Create a f**k image with member mentions",
    category: "nsfw",
    guide: "{pn} @tag"
  },

  onStart: async function ({ message, event, args }) {
    const mention = Object.keys(event.mentions);
    let one, two;

    if (mention.length == 0) {
      if (!event.messageReply) return message.reply("Please mention someone or reply to a message");
      one = event.senderID;
      two = event.messageReply.senderID;
    } else if (mention.length == 1) {
      one = event.senderID;
      two = mention[0];
    } else {
      one = mention[1];
      two = mention[0];
    }

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const pth = path.join(cacheDir, `fucked_${one}_${two}.png`);

    try {
      await bal(one, two, pth);
      await message.reply({ 
        body: "「 Harder daddy 🥵💦 」", 
        attachment: fs.createReadStream(pth) 
      });
    } catch (error) {
      console.error(error);
      message.reply("Failed to generate the image. The user's profile picture might be private or unreachable.");
    } finally {
      if (fs.existsSync(pth)) {
        setTimeout(() => fs.unlink(pth).catch(() => {}), 5000);
      }
    }
  }
};

async function bal(one, two, pth) {
  const getAvatar = async (uid) => {
    try {
      const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      return await jimp.read(url);
    } catch (e) {
      // Fallback avatar
      return await jimp.read("https://i.ibb.co/bBSpr5v/143086968-2856368904622192-1959732218791162458-n.png");
    }
  };

  const [avone, avtwo, img] = await Promise.all([
    getAvatar(one),
    getAvatar(two),
    jimp.read("https://i.ibb.co/YpR7Bpv/image.jpg")
  ]);

  avone.circle();
  avtwo.circle();
  
  img.resize(639, 480)
     .composite(avone.resize(90, 90), 23, 320)
     .composite(avtwo.resize(100, 100), 110, 60);

  await img.writeAsync(pth);
  return pth;
}