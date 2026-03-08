/**
 * @author Jin
 * ! The source code is written by Jin, please don't change the author's name everywhere. Thank you for using
 * ! Official source code: https://github.com/NTKhang03/Goat-Bot-V2
 * ! If you do not download the source code from the above address, you are using an unknown version and at risk of having your account hacked
 *
 * English:
 * ! Please do not change the below code, it is very important for the project.
 * It is my motivation to maintain and develop the project for free.
 * ! If you change it, you will be banned forever
 * Thank you for using
 *
 * Vietnamese:
 * ! Vui lòng không thay đổi mã bên dưới, nó rất quan trọng đối với dự án.
 * Nó là động lực để tôi duy trì và phát triển dự án miễn phí.
 * ! Nếu thay đổi nó, bạn sẽ bị cấm vĩnh viễn
 * Cảm ơn bạn đã sử dụng
 */

const { spawn } = require("child_process");
const log = require("./logger/log.js");
const fs = require("fs");
const path = require("path");

// If APPSTATE is provided as env var (e.g. on Render), write it to account.txt
if (process.env.APPSTATE) {
	const accountPath = path.join(__dirname, "account.txt");
	fs.writeFileSync(accountPath, process.env.APPSTATE, "utf8");
	log.info("STARTUP", "Wrote APPSTATE env var to account.txt");
}

function startProject() {
	const child = spawn("node", ["Goat.js"], {
		cwd: __dirname,
		stdio: "inherit",
		shell: true
	});

	child.on("close", (code) => {
		if (code == 2) {
			log.info("Restarting Project...");
			startProject();
		}
	});
}

startProject();
