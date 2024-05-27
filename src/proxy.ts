import consoleKit from "./lib/console-kit";
import formatTime from "./utils/formatTime";
import { IPV4_REGEX, IPV6_REGEX } from "./data/regex";
import { colors } from "./data/colors";
import http from "http";
import chalk from "chalk";
import fs from "fs";

interface ApiResponse {
    code: number;
    data: string;
}

export async function useProxy(url: string, proxy: string, port: string) {
    const options = {
        host: proxy,
        port,
        method: "GET",
        path: url,
        timeout: 5000,
    };

    return new Promise((resolve, reject) => {
        try {
            http.request(options, async (res) => {
                const chunks: Array<Uint8Array> = [];

                res.on("data", (chunk) => chunks.push(chunk));

                res.on("end", () => {
                    resolve({
                        code: res.statusCode,
                        data: Buffer.concat(chunks).toString("utf-8"),
                    });
                });

                res.on("close", (e: object) => {
                    reject(e);
                });

                res.on("error", (e: object) => {
                    reject(e);
                });

                res.socket.on("close", (e: object) => {
                    reject(e);
                });

                res.socket.on("error", (e: object) => {
                    reject(e);
                });
            })
                .on("error", (e: object) => {
                    reject(e);
                })
                .end();
        } catch (e) {
            reject(e);
        }
    });
}

export async function testProxies(
    proxiesList: Exclude<Awaited<ReturnType<typeof checkProxiesList>>, null>
) {
    process.title = "Proximus - Connecting...";

    consoleKit.info("Connecting to proxies in progress...");
    consoleKit.comment(
        "Results may be slow depending on your and proxies network."
    );
    consoleKit.comment(
        "==================================================================="
    );

    const proxiesUp = [];
    const timedoutProxies = [];
    const proxiesOnError = [];

    const updateProcessTitleProgress = () => {
        const numOfProxiesDone =
            proxiesUp.length + timedoutProxies.length + proxiesOnError.length;

        process.title = `Proximus - ${Math.floor(
            (numOfProxiesDone / proxiesList.length) * 100
        )}% (${numOfProxiesDone}/${proxiesList.length})`;
    };

    const performanceCleanup = (marks: string[], measures: string[]) => {
        for (const mark of marks) performance.clearMarks(mark);
        for (const measure of measures) performance.clearMeasures(measure);
    };

    const getProxyTextStyle = (ip: string, port: string) => {
        return `[${chalk.hex(colors.green)(ip)}:${chalk.hex(colors.grey)(
            port
        )}]`;
    };

    const genProxyTextPadEnd = (proxyText: string) => {
        return proxyText.padEnd(proxyTextMaxLength, " ");
    };

    const proxyTextMaxLength =
        Math.max(
            ...proxiesList.map((p) => getProxyTextStyle(p[0], p[1]).length)
        ) + 1;

    await Promise.all(
        proxiesList.map(async (proxy) => {
            const [startMark, finishMark, latencyMeasure] = [
                `Requesting data from ${proxy[0]}`,
                `Finished receiving from ${proxy[0]}`,
                `LatencyMeasure for ${proxy[0]}`,
            ];
            const proxyText = getProxyTextStyle(proxy[0], proxy[1]);

            const getLatencyMeasures = () => {
                performance.mark(finishMark);
                return performance.measure(
                    latencyMeasure,
                    startMark,
                    finishMark
                );
            };

            consoleKit.info(`Trying to connect with ${proxyText}...`);
            performance.mark(startMark);
            return await useProxy("http://ip-api.com/json/", proxy[0], proxy[1])
                .then((res) => {
                    updateProcessTitleProgress();

                    const { text } = formatTime(getLatencyMeasures().duration);

                    switch ((res as ApiResponse).code) {
                        case 200:
                            const body = JSON.parse((res as ApiResponse).data);
                            proxiesUp.push([proxy[0], proxy[1]]);

                            consoleKit.check(
                                `${genProxyTextPadEnd(
                                    proxyText
                                )} is up and ready to be used. [ Time: ${text} ] - ${
                                    body.country
                                } / ${body.as}`
                            );
                            break;
                        case 403:
                            proxiesOnError.push([proxy[0], proxy[1]]);
                            consoleKit.x(
                                `${genProxyTextPadEnd(
                                    proxyText
                                )} revoked your connection. Not authorized. [ Time: ${text} ]`
                            );
                            break;
                        default:
                            proxiesOnError.push([proxy[0], proxy[1]]);
                            consoleKit.x(
                                `${genProxyTextPadEnd(
                                    proxyText
                                )} responded with Error ${
                                    (res as ApiResponse).code
                                }. [ Time: ${text} ]`
                            );
                            break;
                    }

                    performanceCleanup(
                        [startMark, finishMark],
                        [latencyMeasure]
                    );
                })
                .catch((e) => {
                    updateProcessTitleProgress();

                    const { text } = formatTime(getLatencyMeasures().duration);

                    if (e.code) {
                        switch (e.code) {
                            case "ECONNRESET":
                                proxiesOnError.push([proxy[0], proxy[1]]);
                                consoleKit.x(
                                    `${genProxyTextPadEnd(
                                        proxyText
                                    )} has reset the connection with you. [ Time: ${text} ]`
                                );
                                break;
                            case "ETIMEDOUT":
                                timedoutProxies.push([proxy[0], proxy[1]]);
                                consoleKit.warn(
                                    `${genProxyTextPadEnd(
                                        proxyText
                                    )} may be busy or down, timed out. [ Time: ${text} ]`
                                );
                                break;
                        }
                    } else {
                        proxiesOnError.push([proxy[0], proxy[1]]);
                        consoleKit.x(
                            `${genProxyTextPadEnd(
                                proxyText
                            )} responded with incorrect data. [ Time: ${text} ]`
                        );
                    }

                    performanceCleanup(
                        [startMark, finishMark],
                        [latencyMeasure]
                    );
                });
        })
    );

    process.title = "Proximus - Done!";

    const resultMsg = `[ ${chalk.hex(colors.green)(
        proxiesUp.length
    )} ] working / [ ${chalk.hex(colors.yellow)(
        timedoutProxies.length
    )} ] timed out / [ ${chalk.hex(colors.red)(
        proxiesOnError.length
    )} ] sent errors`;

    consoleKit.comment("=".repeat(resultMsg.length / 2));
    consoleKit.info(resultMsg);
    consoleKit.comment("=".repeat(resultMsg.length / 2));
}

export function checkProxiesList() {
    try {
        const proxiesList = fs.readFileSync("./proxies.txt");
        const proxies = proxiesList.toString("utf-8").split("\r\n");
        const sanitizedProxies: [string, string][] = [];

        for (const proxy of proxies) {
            const psplit = proxy.split(":");
            const ipv4 = psplit[0].match(IPV4_REGEX)?.[0];
            /*const ipv6 = proxy.match(IPV6_REGEX)?.[0]*/

            if (ipv4) sanitizedProxies.push([ipv4, psplit[1]] as const);
            //if (ipv6) sanitizedProxies.push([ipv4, psplit[1]] as const);
        }

        return sanitizedProxies;
    } catch (e) {
        consoleKit.warn("The file proxies.txt was not found, creating one...");

        try {
            fs.appendFileSync("./proxies.txt", "");
            return null;
        } catch (e) {
            consoleKit.x(
                "Unable to create proxies.txt, try to run Proximus as admin prog or create it yourself."
            );
            process.exit();
        }
    }
}
