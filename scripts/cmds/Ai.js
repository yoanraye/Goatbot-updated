const axios = require('axios');
const API_ENDPOINT = 'https://metakexbyneokex.fly.dev/chat';

module.exports = {
  config: {
    name: "ai",
    version: "1",
    role: 0,
    author: "Rika",
    description: "Chat with Meta Ai",
    category: "AI",
    usages: "[message] or reply to the bot's message.",
    cooldowns: 5
  },

  onStart: async function({ message, args, event, threadsData, role }) {
    if (args[0] === "auto") {
      if (role < 2) return message.reply("━━━━━━━━━━━━━━━\n  ⚠️ PERMISSION DENIED ⚠️\n━━━━━━━━━━━━━━━\n\nOnly those with Admin Authority can unlock this command!\n━━━━━━━━━━━━━━━");
      if (args[1] === "on") {
        await threadsData.set(event.threadID, true, "settings.aiAuto");
        return message.reply("Auto AI response is now ON for this group.");
      } else if (args[1] === "off") {
        await threadsData.set(event.threadID, false, "settings.aiAuto");
        return message.reply("Auto AI response is now OFF for this group.");
      }
      return message.reply("Usage: ai auto [on|off]");
    }

    if (event.senderID == api.getCurrentUserID()) return;

    const userMessage = args.join(" ");
    if (!userMessage) {
      return message.reply("Please provide a message or use 'ai auto on/off'.");
    }

    const senderID = event.senderID;
    const sessionID = `chat-${senderID}`;

    try {
      const prompt = `Respond as a human in a chat, be precise, short, and use a natural tone. Message: ${userMessage}`;
      
      const fullResponse = await axios.get(`https://chatgpt.apinepdev.workers.dev/?question=${encodeURIComponent(prompt)}`, {
          timeout: 15000 
      });
      
      const aiMessage = fullResponse.data.answer;

      if (typeof aiMessage === 'string' && aiMessage.trim().length > 0) {
          await message.reply(aiMessage, (err, info) => {
              if (info) {
                  global.GoatBot.onReply.set(info.messageID, {
                      commandName: this.config.name,
                      author: senderID,
                      messageID: info.messageID,
                      sessionID: sessionID 
                  });
              }
          });
      } else {
          await message.reply("AI responded successfully, but the message was empty. Please try again.");
      }

    } catch (error) {
      let errorMsg = "An unknown error occurred while contacting the AI.";
      if (error.response) {
          errorMsg = `API Error: Status ${error.response.status}. The server may be unavailable.`;
      } else if (error.code === 'ECONNABORTED') {
          errorMsg = "Request timed out. The AI took too long to respond.";
      }
      await message.reply(`❌ AI Command Failed\n\nError: ${errorMsg}`);
    }
  },

  onReply: async function ({ message, event, Reply }) {
    const userID = event.senderID;
    const query = event.body?.trim();
    
    if (userID !== Reply.author || !query) return;

    global.GoatBot.onReply.delete(Reply.messageID);

    try {
      const prompt = `Respond as a human in a chat, be precise, short, and use a natural tone. Message: ${query}`;
      
      const fullResponse = await axios.get(`https://chatgpt.apinepdev.workers.dev/?question=${encodeURIComponent(prompt)}`, {
          timeout: 15000 
      });
      
      const aiMessage = fullResponse.data.answer;

      if (typeof aiMessage === 'string' && aiMessage.trim().length > 0) {
          await message.reply(aiMessage, (err, info) => {
              if (info) {
                  global.GoatBot.onReply.set(info.messageID, {
                      commandName: this.config.name,
                      author: userID,
                      messageID: info.messageID,
                      sessionID: Reply.sessionID 
                  });
              }
          });
      }
    } catch (error) {}
  },

  onChat: async function ({ threadsData, message, event, prefix, api }) {
    if (event.senderID == api.getCurrentUserID() || !event.body || event.body.startsWith(prefix)) return;

    const threadID = event.threadID;
    const now = Date.now();
    
    if (!global.temp.aiAutoCache) global.temp.aiAutoCache = {};
    
    let isAuto;
    if (global.temp.aiAutoCache[threadID] && (now - global.temp.aiAutoCache[threadID].lastCheck < 60000)) {
        isAuto = global.temp.aiAutoCache[threadID].value;
    } else {
        isAuto = await threadsData.get(threadID, "settings.aiAuto");
        global.temp.aiAutoCache[threadID] = { value: isAuto, lastCheck: now };
    }

    if (isAuto) {
      try {
        let msg = event.body;
        const prompt = `Respond as a human in a chat, be precise, short, and use a natural tone. Message: ${msg}`;
        
        const fullResponse = await axios.get(`https://chatgpt.apinepdev.workers.dev/?question=${encodeURIComponent(prompt)}`, {
            timeout: 15000 
        });
        const aiMessage = fullResponse.data.answer;
        if (aiMessage) message.reply(aiMessage);
      } catch (error) {}
    }
  }
};
