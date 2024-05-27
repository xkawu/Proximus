import consoleKit from "../lib/console-kit";
import chalk from "chalk";

export function displayTitle() {
    const title: string =
        "____________ _______   __________  ____   _ _____ \r\n| ___ \\ ___ \\  _  \\ \\ / /_   _|  \\/  | | | /  ___|\r\n| |_/ / |_/ / | | |\\ V /  | | | .  . | | | \\ `--. \r\n|  __/|    /| | | |/   \\  | | | |\\/| | | | |`--. \\\r\n| |   | |\\ \\\\ \\_/ / /^\\ \\_| |_| |  | | |_| /\\__/ /\r\n\\_|   \\_| \\_|\\___/\\/   \\/\\___/\\_|  |_/\\___/\\____/";

    console.clear();
    console.log(chalk.red(title));
    consoleKit.comment("Proxy manager made by kxwu");
    console.log(" ");
}
