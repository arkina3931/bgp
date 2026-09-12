const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

class FakeInput {
    constructor(document) {
        this.document = document;
        this.id = 'avalon-name-input';
        this.value = '';
        this.listeners = {};
    }

    addEventListener(type, listener) {
        this.listeners[type] = listener;
    }

    focus() {
        this.document.activeElement = this;
    }

    dispatchInput() {
        this.listeners.input.call(this);
    }
}

class FakeDocument {
    constructor() {
        this.activeElement = null;
        this.nameInput = null;
        this.joinButton = null;
        this.renderCount = 0;
        this.app = {
            classList: {
                add() {},
                remove() {},
            },
        };
        this.content = {};
        Object.defineProperty(this.content, 'innerHTML', {
            set: (html) => {
                this.renderCount += 1;
                if (this.activeElement === this.nameInput) {
                    this.activeElement = null;
                }
                this.nameInput = html.includes('id="avalon-name-input"')
                    ? new FakeInput(this)
                    : null;
                if (html.includes('id="avalon-join-button"')) {
                    const buttonMarkup = html.match(/<button[^>]*id="avalon-join-button"[^>]*>/)[0];
                    this.joinButton = { disabled: buttonMarkup.includes(' disabled') };
                } else {
                    this.joinButton = null;
                }
            },
        });
    }

    getElementById(id) {
        if (id === 'avalon-content') return this.content;
        if (id === 'avalon-app') return this.app;
        if (id === 'avalon-name-input') return this.nameInput;
        if (id === 'avalon-join-button') return this.joinButton;
        return null;
    }

    createElement() {
        return {
            textContent: '',
            get innerHTML() {
                return this.textContent;
            },
        };
    }
}

function loadAvalonPage() {
    const templatePath = path.join(__dirname, '..', 'Avalon', 'index.html');
    const template = fs.readFileSync(templatePath, 'utf8');
    const scripts = [...template.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    const document = new FakeDocument();
    const storage = new Map();
    let lobbyResponse = {
        status: 'joining',
        current_count: 0,
        target_count: 5,
        players: [],
        previous_players: [],
        lancelot_enabled: false,
        excalibur_enabled: false,
        lady_of_lake_enabled: false,
    };
    const context = {
        console,
        document,
        localStorage: {
            getItem: (key) => storage.get(key) || null,
            setItem: (key, value) => storage.set(key, value),
        },
        setInterval: () => 1,
        setTimeout: () => 1,
        api: async (url) => {
            if (url === '/avalon/leaderboard') return { leaderboard: [] };
            if (url === '/avalon/lobby') return lobbyResponse;
            throw new Error(`Unexpected API call: ${url}`);
        },
        renderLeaderboard() {},
        showConfirm: async () => true,
        showToast() {},
    };
    context.window = context;
    context.matchMedia = () => ({ matches: false });
    context.escHtml = (value) => String(value ?? '');

    vm.createContext(context);
    vm.runInContext(scripts.at(-1)[1], context, { filename: templatePath });
    return {
        context,
        document,
        setLobbyResponse(response) {
            lobbyResponse = response;
        },
    };
}

test('lobby polling preserves the focused Avalon name input', async () => {
    const { context, document } = loadAvalonPage();
    await new Promise(setImmediate);

    const input = document.nameInput;
    input.value = 'Alice';
    input.dispatchInput();
    input.focus();
    const renderCount = document.renderCount;

    await context.fetchAndUpdate();

    assert.equal(document.renderCount, renderCount);
    assert.equal(document.activeElement, input);
    assert.equal(input.value, 'Alice');
});

test('typing a name enables the Avalon join button without a rebuild', async () => {
    const { document } = loadAvalonPage();
    await new Promise(setImmediate);

    const input = document.nameInput;
    assert.equal(document.joinButton.disabled, true);
    input.focus();
    input.value = 'Alice';
    input.dispatchInput();

    assert.equal(document.joinButton.disabled, false);
    assert.equal(document.activeElement, input);
});

test('polling can leave the lobby when the game starts during name editing', async () => {
    const { context, document, setLobbyResponse } = loadAvalonPage();
    await new Promise(setImmediate);

    const input = document.nameInput;
    input.value = 'Alice';
    input.dispatchInput();
    input.focus();
    const renderCount = document.renderCount;
    setLobbyResponse({
        status: 'active',
        current_count: 5,
        target_count: 5,
        players: ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'],
        previous_players: [],
        lancelot_enabled: false,
        excalibur_enabled: false,
        lady_of_lake_enabled: false,
    });

    await context.fetchAndUpdate();

    assert.equal(context.state.step, 3);
    assert.equal(document.renderCount, renderCount + 1);
    assert.equal(document.nameInput, null);
});

test('explicit Avalon renders are not blocked by name input focus', async () => {
    const { context, document } = loadAvalonPage();
    await new Promise(setImmediate);

    const input = document.nameInput;
    input.focus();
    const renderCount = document.renderCount;

    context.renderUI();

    assert.equal(document.renderCount, renderCount + 1);
});
