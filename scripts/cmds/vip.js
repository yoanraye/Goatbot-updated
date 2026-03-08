module.exports = {
        config: {
                name: "vip",
                aliases: ["premium"],
                version: "1.0",
                author: "Jin",
                countDown: 5,
                role: 0,
                requiredMoney: 5000,
                description: {
                        vi: "Lệnh VIP - yêu cầu $5000 để sử dụng",
                        en: "VIP command - requires $5000 to use"
                },
                category: "premium",
                guide: {
                        vi: '   {pn}: Xem thông tin VIP của bạn',
                        en: '   {pn}: View your VIP information'
                }
        },

        langs: {
                vi: {
                        vipInfo: "★ Thông tin VIP\n━━━━━━━━━━━━━━━\n✓ Bạn đã mở khóa tính năng VIP!\n✓ Số dư: $%1\n✓ Trạng thái: Premium User\n━━━━━━━━━━━━━━━\nCảm ơn bạn đã sử dụng!"
                },
                en: {
                        vipInfo: "★ VIP Information\n━━━━━━━━━━━━━━━\n✓ You have unlocked VIP features!\n✓ Balance: $%1\n✓ Status: Premium User\n━━━━━━━━━━━━━━━\nThank you for using!"
                }
        },

        onStart: async function ({ message, usersData, event, getLang }) {
                const userData = await usersData.get(event.senderID);
                const userMoney = userData.money || 0;
                
                return message.reply(getLang("vipInfo", userMoney));
        }
};