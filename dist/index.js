#!/usr/bin/env node

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dc_management_sdk_js_1 = require("dc-management-sdk-js");
const dotenv = __importStar(require("dotenv"));
var pjson = require('../package.json');
const prompt = require('prompt-sync')({ sigint: true });
// Load config from .env file
dotenv.config();
// Terminal colors
const Reset = "\x1b[0m";
const Bright = "\x1b[1m";
const Dim = "\x1b[2m";
const Underscore = "\x1b[4m";
const Blink = "\x1b[5m";
const Reverse = "\x1b[7m";
const Hidden = "\x1b[8m";
const FgBlack = "\x1b[30m";
const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgYellow = "\x1b[33m";
const FgBlue = "\x1b[34m";
const FgMagenta = "\x1b[35m";
const FgCyan = "\x1b[36m";
const FgWhite = "\x1b[37m";
const BgBlack = "\x1b[40m";
const BgRed = "\x1b[41m";
const BgGreen = "\x1b[42m";
const BgYellow = "\x1b[43m";
const BgBlue = "\x1b[44m";
const BgMagenta = "\x1b[45m";
const BgCyan = "\x1b[46m";
const BgWhite = "\x1b[47m";
let client;
let quit = false;
/**
 * Prepare all tokens, expand variables, evaluate expressions
 *
 * @param tokens tokens from user prompt
 * @returns prepared tokens
 */
const prepareTokens = (tokens) => {
    return tokens.map((item) => {
        item = item.replace(/\\s/g, ' ');
        if (item.startsWith('{{') && item.endsWith('}}')) {
            const variable = item.substring(2, item.length - 2);
            const storeVariable = context.variables[variable];
            if (storeVariable)
                return storeVariable;
            else
                return item;
        }
        else if (item.startsWith("`") && item.endsWith("`")) {
            const expression = item.substring(1, item.length - 1);
            try {
                return eval(expression);
            }
            catch (error) {
                return error.message;
            }
        }
        else if (item.startsWith('"') && item.endsWith('"')) {
            return item.substring(1, item.length - 1);
        }
        else {
            return item;
        }
    });
};
/**
 * Paginate results from management sdk
 *
 * @param pagableFn
 * @param options
 * @returns
 */
const paginator = (pagableFn, options = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const currentPage = yield pagableFn(Object.assign(Object.assign({}, options), { size: 200 }));
    if (currentPage.page &&
        currentPage.page.number !== undefined &&
        currentPage.page.totalPages !== undefined &&
        currentPage.page.number + 1 < currentPage.page.totalPages) {
        return [
            ...currentPage.getItems(),
            ...(yield paginator(pagableFn, Object.assign(Object.assign({}, options), { page: currentPage.page.number + 1 })))
        ];
    }
    return currentPage.getItems();
});
/**
 * Last single result
 */
let result;
/**
 * Last array result (for instance, list of items)
 */
let results;
/**
 * Global context
 */
let context = {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    hubId: process.env.HUB_ID,
    repoId: process.env.REPO_ID,
    folderId: process.env.FOLDER_ID,
    variables: {}
};
/**
 * Connect to Amplience Dynamic Content instance
 *
 * @param args client id, client secret, hub id
 */
const connect = (args) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Connecting to Dynamic Content...');
    client = new dc_management_sdk_js_1.DynamicContent({
        client_id: args[0],
        client_secret: args[1]
    });
    if (args.length >= 3) {
        yield getHub([args[2]]);
    }
});
/**
 * Display Amplience Client details
 */
const showClient = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(client);
});
/**
 * Show context information
 */
const showContext = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(context);
});
/**
 * Showing all variables
 */
const showVariables = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(context.variables);
});
/**
 * Printing tokens after preparation (expanding variables, evaluating expressions)
 *
 * @param args tokens
 */
const echo = (args) => __awaiter(void 0, void 0, void 0, function* () {
    if (args.length > 0)
        console.log(args.join(' '));
});
/**
 * Store a variablem or remove variable if value is empty
 *
 * @param args variable name, variable value
 */
const setVariable = (args) => __awaiter(void 0, void 0, void 0, function* () {
    if (args.length > 0) {
        if (args.length == 1) {
            delete context.variables[args[0]];
        }
        else if (args.length == 2) {
            context.variables[args[0]] = args[1];
        }
    }
});
/**
 * Evaluate a javascript expression, access to context, client, result, results
 *
 * @param args Expression
 */
const evalExpression = (args) => __awaiter(void 0, void 0, void 0, function* () {
    const expression = args.join(' ');
    const evalResult = eval(expression);
    console.log(evalResult);
});
const showNumberOfResults = (results) => {
    console.log(`${Dim}${results.length} result${results.length > 1 ? 's' : ''}${Reset}`);
};
/**
 * List all hubs
 */
const listHubs = () => __awaiter(void 0, void 0, void 0, function* () {
    const hubs = yield paginator(client.hubs.list);
    hubs.forEach((hub) => {
        console.log(`${FgGreen}${hub.label}${Reset} : ${FgGreen}${hub.name}${Reset} : ${Dim}${hub.id}${Reset}`);
    });
    results = hubs;
    showNumberOfResults(results);
});
/**
 * Get a hub by id, name or beginning of name
 *
 * @param args id, name or beginning of name
 */
const getHub = (args) => __awaiter(void 0, void 0, void 0, function* () {
    if (args.length > 0) {
        let hub;
        const hubs = yield paginator(client.hubs.list);
        let filterHubs = hubs.filter(item => item.name == args[0]);
        if (filterHubs.length == 0) {
            filterHubs = hubs.filter(item => { var _a; return (_a = item.name) === null || _a === void 0 ? void 0 : _a.startsWith(args[0]); });
        }
        if (filterHubs.length > 0) {
            hub = filterHubs[0];
        }
        else {
            hub = yield client.hubs.get(args[0]);
        }
        if (hub) {
            result = hub;
            context.hub = hub;
            delete context.repo;
            delete context.folder;
            console.log(`${FgGreen}${hub.label}${Reset} : ${FgGreen}${hub.name}${Reset} : ${Dim}${hub.id}${Reset}`);
        }
    }
});
/**
 * Get hub settings
 */
const getHubSettings = () => __awaiter(void 0, void 0, void 0, function* () {
    if (context.hub) {
        const settings = context.hub.settings;
        result = settings;
        context.settings = settings;
        console.log(JSON.stringify(settings, null, 4));
    }
});
/**
 * Get a list of all schemas
 */
const getSchemas = () => __awaiter(void 0, void 0, void 0, function* () {
    if (context.hub) {
        const currentHub = context.hub;
        const schemas = yield paginator(currentHub.related.contentTypeSchema.list);
        const schemasFilter = schemas.filter((item) => item.status == dc_management_sdk_js_1.Status.ACTIVE);
        schemasFilter
            .forEach((item) => { console.log(`${FgCyan}${item.schemaId}${Reset}`); });
        results = schemasFilter;
        showNumberOfResults(results);
    }
});
/**
 * Get a schema by schema id
 *
 * @param args schema id
 */
const getSchema = (args) => __awaiter(void 0, void 0, void 0, function* () {
    if (context.hub) {
        const currentHub = context.hub;
        const schemas = yield paginator(currentHub.related.contentTypeSchema.list);
        const filterSchemas = schemas.filter((item) => item.schemaId == args[0]);
        if (filterSchemas.length > 0) {
            const schema = filterSchemas[0];
            result = filterSchemas;
            const itemAny = schema;
            delete itemAny._links;
            delete itemAny.related;
            delete itemAny.client;
            console.log(JSON.stringify(itemAny, null, 4));
        }
    }
});
/**
 * Get all content types
 */
const getTypes = () => __awaiter(void 0, void 0, void 0, function* () {
    if (context.hub) {
        const currentHub = context.hub;
        const types = yield paginator(currentHub.related.contentTypes.list);
        const typesFilter = types.filter((item) => item.status == dc_management_sdk_js_1.Status.ACTIVE);
        typesFilter
            .forEach((item) => { var _a; console.log(`${FgBlue}${(_a = item.settings) === null || _a === void 0 ? void 0 : _a.label}${Reset} : ${FgCyan}${item.contentTypeUri}${Reset} : ${Dim}${item.id}${Reset}`); });
        results = typesFilter;
        showNumberOfResults(results);
    }
});
/**
 * Get a type by id
 *
 * @param args type id
 */
const getType = (args) => __awaiter(void 0, void 0, void 0, function* () {
    if (context.hub && args.length > 0) {
        const currentHub = context.hub;
        const type = yield currentHub.related.contentTypes.get(args[0]);
        console.log(JSON.stringify(type, null, 4));
        result = type;
    }
});
/**
 * Get all repositories
 */
const getRepositories = () => __awaiter(void 0, void 0, void 0, function* () {
    if (context.hub) {
        const currentHub = context.hub;
        const repos = yield paginator(currentHub.related.contentRepositories.list);
        const reposFilter = repos.filter((item) => item.status == dc_management_sdk_js_1.Status.ACTIVE);
        reposFilter
            .forEach((item) => {
            console.log(`${FgRed}${item.label}${Reset} : ${FgRed}${item.name}${Reset} : ${Dim}${item.id}${Reset}`);
        });
        results = reposFilter;
        showNumberOfResults(results);
    }
});
/**
 * Get a repository by id, name or beginning of a name
 *
 * @param args
 */
const getRepository = (args) => __awaiter(void 0, void 0, void 0, function* () {
    if (args.length == 0) {
        delete context.repo;
        delete context.folder;
    }
    else if (context.hub) {
        const currentHub = context.hub;
        const repos = yield paginator(currentHub.related.contentRepositories.list);
        let filterRepos = repos.filter((repo) => repo.id == args[0]);
        if (filterRepos.length == 0) {
            filterRepos = repos.filter((repo) => repo.name == args[0]);
            if (filterRepos.length == 0) {
                filterRepos = repos.filter((repo) => { var _a; return (_a = repo.name) === null || _a === void 0 ? void 0 : _a.startsWith(args[0]); });
            }
        }
        if (filterRepos.length > 0) {
            const repo = filterRepos[0];
            context.repo = repo;
            result = repo;
            delete context.folder;
            console.log(`${FgRed}${repo.label}${Reset} : ${FgRed}${repo.name}${Reset} : ${Dim}${repo.id}${Reset}`);
        }
    }
});
/**
 * Get folders in a repo or current folder
 */
const getFolders = () => __awaiter(void 0, void 0, void 0, function* () {
    if (context.repo) {
        let folders;
        if (context.folder) {
            const currentFolder = context.folder;
            folders = yield paginator(currentFolder.related.folders.list);
        }
        else {
            const currentRepo = context.repo;
            folders = yield paginator(currentRepo.related.folders.list);
        }
        folders
            .forEach((item) => {
            console.log(`${FgYellow}${item.name}${Reset} : ${Dim}${item.id}${Reset}`);
        });
        results = folders;
        showNumberOfResults(results);
    }
});
/**
 * Get folder in a repo or folder, or go up to the parent folder
 *
 * @param args folder name, empty or '..'
 */
const getFolder = (args) => __awaiter(void 0, void 0, void 0, function* () {
    if (context.repo) {
        let folders;
        if (context.folder) {
            const currentFolder = context.folder;
            folders = yield paginator(currentFolder.related.folders.list);
        }
        else {
            const currentRepo = context.repo;
            folders = yield paginator(currentRepo.related.folders.list);
        }
        if (args.length == 0) {
            delete context.folder;
        }
        else if (args.length > 0 && args[0] == '..') {
            const currentFolder = context.folder;
            let parentFolder;
            try {
                parentFolder = yield currentFolder.related.folders.parent();
                context.folder = parentFolder;
                result = parentFolder;
            }
            catch (error) {
                delete context.folder;
            }
        }
        else if (args.length > 0) {
            let filterFolders = folders.filter((folder) => folder.id == args[0]);
            if (filterFolders.length == 0) {
                filterFolders = folders.filter((folder) => folder.name == args[0]);
                if (filterFolders.length == 0) {
                    filterFolders = folders.filter((folder) => { var _a; return (_a = folder.name) === null || _a === void 0 ? void 0 : _a.startsWith(args[0]); });
                }
            }
            if (filterFolders.length > 0) {
                const newFolder = filterFolders[0];
                context.folder = newFolder;
                result = newFolder;
                console.log(`${FgYellow}${newFolder.name}${Reset} : ${Dim}${newFolder.id}${Reset}`);
            }
        }
    }
});
/**
 * Get content items in repo or current folder
 */
const getItems = () => __awaiter(void 0, void 0, void 0, function* () {
    if (context.folder) {
        const currentFolder = context.folder;
        const items = yield paginator(currentFolder.related.contentItems.list);
        const itemsFilter = items.filter((item) => item.status == dc_management_sdk_js_1.Status.ACTIVE);
        itemsFilter
            .forEach((item) => { var _a, _b; console.log(`${FgMagenta}${item.label}${Reset} : ${Dim}${item.id}${Reset}${((_a = item.body._meta) === null || _a === void 0 ? void 0 : _a.deliveryKey) ? ' : ' + ((_b = item.body._meta) === null || _b === void 0 ? void 0 : _b.deliveryKey) : ''}`); });
        results = itemsFilter;
        showNumberOfResults(results);
    }
    else {
        if (context.repo) {
            const currentRepo = context.repo;
            const items = yield paginator(currentRepo.related.contentItems.list);
            const itemsFilter = items.filter((item) => item.status == dc_management_sdk_js_1.Status.ACTIVE);
            itemsFilter
                .forEach((item) => { var _a, _b; console.log(`${FgMagenta}${item.label}${Reset} : ${Dim}${item.id}${Reset}${((_a = item.body._meta) === null || _a === void 0 ? void 0 : _a.deliveryKey) ? ' : ' + ((_b = item.body._meta) === null || _b === void 0 ? void 0 : _b.deliveryKey) : ''}`); });
            results = itemsFilter;
            showNumberOfResults(results);
        }
    }
});
/**
 * Get folders and items in the current repo or folder
 * @param args
 */
const listContent = () => __awaiter(void 0, void 0, void 0, function* () {
    yield getFolders([]);
    yield getItems([]);
});
/**
 * Get a content item by id
 *
 * @param args contentId
 */
const getItemById = (args) => __awaiter(void 0, void 0, void 0, function* () {
    if (client && args.length > 0) {
        const item = yield client.contentItems.get(args[0]);
        result = item;
        const itemAny = item;
        delete itemAny._links;
        delete itemAny.related;
        delete itemAny.client;
        console.log(JSON.stringify(itemAny, null, 4));
    }
});
/**
 * Get all extensions
 */
const getExtensions = () => __awaiter(void 0, void 0, void 0, function* () {
    if (context.hub) {
        const currentHub = context.hub;
        const extensions = yield paginator(currentHub.related.extensions.list);
        extensions.forEach((extension) => {
            console.log(`${FgCyan}${extension.label}${Reset} : ${FgCyan}${extension.name}${Reset} : ${extension.category} : ${Dim}${extension.id}${Reset}`);
        });
        results = extensions;
        showNumberOfResults(results);
    }
});
/**
 * Get an extension by name
 *
 * @param args extension name
 */
const getExtension = (args) => __awaiter(void 0, void 0, void 0, function* () {
    if (context.hub && args.length > 0) {
        const currentHub = context.hub;
        let extension;
        extension = yield currentHub.related.extensions.getByName(args[0]);
        const extensionAsAny = extension;
        delete extensionAsAny._links;
        delete extensionAsAny.related;
        delete extensionAsAny.client;
        console.log(JSON.stringify(extensionAsAny, null, 4));
        result = extension;
    }
});
/**
 * Get all webhooks
 */
const getWebhooks = () => __awaiter(void 0, void 0, void 0, function* () {
    if (context.hub) {
        const currentHub = context.hub;
        const webhooks = yield paginator(currentHub.related.webhooks.list);
        webhooks.forEach((webhook) => {
            console.log(`${FgCyan}${webhook.label}${Reset} : ${FgCyan}${webhook.active}${Reset} : ${Dim}${webhook.id}${Reset}`);
        });
        results = webhooks;
        showNumberOfResults(results);
    }
});
/**
 * Get a webhook by id
 *
 * @param args webhook id
 */
const getWebhook = (args) => __awaiter(void 0, void 0, void 0, function* () {
    if (context.hub && args.length > 0) {
        const currentHub = context.hub;
        const webhook = yield currentHub.related.webhooks.get(args[0]);
        const webhookAsAny = webhook;
        delete webhookAsAny._links;
        delete webhookAsAny.related;
        delete webhookAsAny.client;
        console.log(JSON.stringify(webhookAsAny, null, 4));
        result = webhook;
    }
});
/**
 * Switch environment
 *
 * @param args env name
 */
const getEnv = (args) => __awaiter(void 0, void 0, void 0, function* () {
    if (args.length > 0) {
        dotenv.config({ path: `./.env.${args[0]}`, override: true });
        if (process.env.CLIENT_ID && process.env.CLIENT_SECRET) {
            context = {
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                hubId: process.env.HUB_ID,
                repoId: process.env.REPO_ID,
                variables: {}
            };
            yield (connect([context.clientId, context.clientSecret, context.hubId]));
            if (context.repoId) {
                yield getRepository([context.repoId]);
            }
        }
    }
});
/**
 * Exit command
 */
const exit = () => __awaiter(void 0, void 0, void 0, function* () {
    quit = true;
});
// all commands mapping and aliases
const commandsMapping = {
    'conn': connect,
    'connect': connect,
    'context': showContext,
    'client': showClient,
    'eval': evalExpression,
    'hubs': listHubs,
    'hub': getHub,
    'settings': getHubSettings,
    'schemas': getSchemas,
    'schema': getSchema,
    'types': getTypes,
    'type': getType,
    'repos': getRepositories,
    'repo': getRepository,
    'folders': getFolders,
    'ls': listContent,
    'cd': getFolder,
    'folder': getFolder,
    'items': getItems,
    'item': getItemById,
    'cat': getItemById,
    'extensions': getExtensions,
    'extension': getExtension,
    'webhooks': getWebhooks,
    'webhook': getWebhook,
    'exit': exit,
    'quit': exit,
    'bye': exit,
    'env': getEnv,
    'setvar': setVariable,
    'set': setVariable,
    'var': setVariable,
    'vars': showVariables,
    'variables': showVariables,
    'echo': echo,
    'print': echo
};
// main console loop
const runConsole = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Dynamic Content Console v${pjson.version}`);
    // connect to Amplience Dynamic Content instance
    if (context.clientId && context.clientSecret) {
        yield (connect([context.clientId, context.clientSecret]));
        if (context.hubId) {
            yield getHub([context.hubId]);
        }
        if (context.repoId) {
            yield getRepository([context.repoId]);
        }
        if (context.folderId) {
            yield getFolder([context.folderId]);
        }
    }
    while (!quit) {
        // building prompt
        let promptString = '';
        if (context.hub) {
            promptString += FgGreen + context.hub.name + Reset;
        }
        if (context.repo) {
            promptString += ' > ' + FgRed + context.repo.name + Reset;
        }
        // traversing all folder parents
        let folderPrompt = '';
        if (context.folder) {
            const currentFolder = context.folder;
            folderPrompt = ' > ' + FgYellow + currentFolder.name + Reset;
            try {
                let parentFolder = yield currentFolder.related.folders.parent();
                while (parentFolder) {
                    folderPrompt = ' > ' + FgYellow + parentFolder.name + Reset + folderPrompt;
                    parentFolder = yield parentFolder.related.folders.parent();
                }
            }
            catch (error) { }
        }
        promptString += folderPrompt;
        const input = prompt(promptString + ' > ')
            .replace(/\s+(?=(?:(?:[^`]*`){2})*[^`]*`[^`]*$)/g, "\\s") // replace all spaces within ``
            .replace(/\s+(?=(?:(?:[^"]*"){2})*[^"]*"[^"]*$)/g, "\\s") // replace all spaces within ""
            .replace(/\\ /g, "\\s"); // replace all "\ "
        // getting tokens and executing command
        const tokens = prepareTokens(input.split(' '));
        if (tokens.length > 0) {
            const userCommand = tokens[0];
            const command = commandsMapping[userCommand];
            if (command) {
                try {
                    yield command(tokens.slice(1));
                }
                catch (error) {
                    console.error(error.message);
                }
            }
        }
    }
});
runConsole();
