(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/artemis/Documents/apps/table-miner/app/node_modules/mousetrap/mousetrap.js":[function(require,module,exports){
/*global define:false */
/**
 * Copyright 2015 Craig Campbell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Mousetrap is a simple keyboard shortcut library for Javascript with
 * no external dependencies
 *
 * @version 1.5.3
 * @url craig.is/killing/mice
 */
(function(window, document, undefined) {

    /**
     * mapping of special keycodes to their corresponding keys
     *
     * everything in this dictionary cannot use keypress events
     * so it has to be here to map to the correct keycodes for
     * keyup/keydown events
     *
     * @type {Object}
     */
    var _MAP = {
        8: 'backspace',
        9: 'tab',
        13: 'enter',
        16: 'shift',
        17: 'ctrl',
        18: 'alt',
        20: 'capslock',
        27: 'esc',
        32: 'space',
        33: 'pageup',
        34: 'pagedown',
        35: 'end',
        36: 'home',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        45: 'ins',
        46: 'del',
        91: 'meta',
        93: 'meta',
        224: 'meta'
    };

    /**
     * mapping for special characters so they can support
     *
     * this dictionary is only used incase you want to bind a
     * keyup or keydown event to one of these keys
     *
     * @type {Object}
     */
    var _KEYCODE_MAP = {
        106: '*',
        107: '+',
        109: '-',
        110: '.',
        111 : '/',
        186: ';',
        187: '=',
        188: ',',
        189: '-',
        190: '.',
        191: '/',
        192: '`',
        219: '[',
        220: '\\',
        221: ']',
        222: '\''
    };

    /**
     * this is a mapping of keys that require shift on a US keypad
     * back to the non shift equivelents
     *
     * this is so you can use keyup events with these keys
     *
     * note that this will only work reliably on US keyboards
     *
     * @type {Object}
     */
    var _SHIFT_MAP = {
        '~': '`',
        '!': '1',
        '@': '2',
        '#': '3',
        '$': '4',
        '%': '5',
        '^': '6',
        '&': '7',
        '*': '8',
        '(': '9',
        ')': '0',
        '_': '-',
        '+': '=',
        ':': ';',
        '\"': '\'',
        '<': ',',
        '>': '.',
        '?': '/',
        '|': '\\'
    };

    /**
     * this is a list of special strings you can use to map
     * to modifier keys when you specify your keyboard shortcuts
     *
     * @type {Object}
     */
    var _SPECIAL_ALIASES = {
        'option': 'alt',
        'command': 'meta',
        'return': 'enter',
        'escape': 'esc',
        'plus': '+',
        'mod': /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? 'meta' : 'ctrl'
    };

    /**
     * variable to store the flipped version of _MAP from above
     * needed to check if we should use keypress or not when no action
     * is specified
     *
     * @type {Object|undefined}
     */
    var _REVERSE_MAP;

    /**
     * loop through the f keys, f1 to f19 and add them to the map
     * programatically
     */
    for (var i = 1; i < 20; ++i) {
        _MAP[111 + i] = 'f' + i;
    }

    /**
     * loop through to map numbers on the numeric keypad
     */
    for (i = 0; i <= 9; ++i) {
        _MAP[i + 96] = i;
    }

    /**
     * cross browser add event method
     *
     * @param {Element|HTMLDocument} object
     * @param {string} type
     * @param {Function} callback
     * @returns void
     */
    function _addEvent(object, type, callback) {
        if (object.addEventListener) {
            object.addEventListener(type, callback, false);
            return;
        }

        object.attachEvent('on' + type, callback);
    }

    /**
     * takes the event and returns the key character
     *
     * @param {Event} e
     * @return {string}
     */
    function _characterFromEvent(e) {

        // for keypress events we should return the character as is
        if (e.type == 'keypress') {
            var character = String.fromCharCode(e.which);

            // if the shift key is not pressed then it is safe to assume
            // that we want the character to be lowercase.  this means if
            // you accidentally have caps lock on then your key bindings
            // will continue to work
            //
            // the only side effect that might not be desired is if you
            // bind something like 'A' cause you want to trigger an
            // event when capital A is pressed caps lock will no longer
            // trigger the event.  shift+a will though.
            if (!e.shiftKey) {
                character = character.toLowerCase();
            }

            return character;
        }

        // for non keypress events the special maps are needed
        if (_MAP[e.which]) {
            return _MAP[e.which];
        }

        if (_KEYCODE_MAP[e.which]) {
            return _KEYCODE_MAP[e.which];
        }

        // if it is not in the special map

        // with keydown and keyup events the character seems to always
        // come in as an uppercase character whether you are pressing shift
        // or not.  we should make sure it is always lowercase for comparisons
        return String.fromCharCode(e.which).toLowerCase();
    }

    /**
     * checks if two arrays are equal
     *
     * @param {Array} modifiers1
     * @param {Array} modifiers2
     * @returns {boolean}
     */
    function _modifiersMatch(modifiers1, modifiers2) {
        return modifiers1.sort().join(',') === modifiers2.sort().join(',');
    }

    /**
     * takes a key event and figures out what the modifiers are
     *
     * @param {Event} e
     * @returns {Array}
     */
    function _eventModifiers(e) {
        var modifiers = [];

        if (e.shiftKey) {
            modifiers.push('shift');
        }

        if (e.altKey) {
            modifiers.push('alt');
        }

        if (e.ctrlKey) {
            modifiers.push('ctrl');
        }

        if (e.metaKey) {
            modifiers.push('meta');
        }

        return modifiers;
    }

    /**
     * prevents default for this event
     *
     * @param {Event} e
     * @returns void
     */
    function _preventDefault(e) {
        if (e.preventDefault) {
            e.preventDefault();
            return;
        }

        e.returnValue = false;
    }

    /**
     * stops propogation for this event
     *
     * @param {Event} e
     * @returns void
     */
    function _stopPropagation(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
            return;
        }

        e.cancelBubble = true;
    }

    /**
     * determines if the keycode specified is a modifier key or not
     *
     * @param {string} key
     * @returns {boolean}
     */
    function _isModifier(key) {
        return key == 'shift' || key == 'ctrl' || key == 'alt' || key == 'meta';
    }

    /**
     * reverses the map lookup so that we can look for specific keys
     * to see what can and can't use keypress
     *
     * @return {Object}
     */
    function _getReverseMap() {
        if (!_REVERSE_MAP) {
            _REVERSE_MAP = {};
            for (var key in _MAP) {

                // pull out the numeric keypad from here cause keypress should
                // be able to detect the keys from the character
                if (key > 95 && key < 112) {
                    continue;
                }

                if (_MAP.hasOwnProperty(key)) {
                    _REVERSE_MAP[_MAP[key]] = key;
                }
            }
        }
        return _REVERSE_MAP;
    }

    /**
     * picks the best action based on the key combination
     *
     * @param {string} key - character for key
     * @param {Array} modifiers
     * @param {string=} action passed in
     */
    function _pickBestAction(key, modifiers, action) {

        // if no action was picked in we should try to pick the one
        // that we think would work best for this key
        if (!action) {
            action = _getReverseMap()[key] ? 'keydown' : 'keypress';
        }

        // modifier keys don't work as expected with keypress,
        // switch to keydown
        if (action == 'keypress' && modifiers.length) {
            action = 'keydown';
        }

        return action;
    }

    /**
     * Converts from a string key combination to an array
     *
     * @param  {string} combination like "command+shift+l"
     * @return {Array}
     */
    function _keysFromString(combination) {
        if (combination === '+') {
            return ['+'];
        }

        combination = combination.replace(/\+{2}/g, '+plus');
        return combination.split('+');
    }

    /**
     * Gets info for a specific key combination
     *
     * @param  {string} combination key combination ("command+s" or "a" or "*")
     * @param  {string=} action
     * @returns {Object}
     */
    function _getKeyInfo(combination, action) {
        var keys;
        var key;
        var i;
        var modifiers = [];

        // take the keys from this pattern and figure out what the actual
        // pattern is all about
        keys = _keysFromString(combination);

        for (i = 0; i < keys.length; ++i) {
            key = keys[i];

            // normalize key names
            if (_SPECIAL_ALIASES[key]) {
                key = _SPECIAL_ALIASES[key];
            }

            // if this is not a keypress event then we should
            // be smart about using shift keys
            // this will only work for US keyboards however
            if (action && action != 'keypress' && _SHIFT_MAP[key]) {
                key = _SHIFT_MAP[key];
                modifiers.push('shift');
            }

            // if this key is a modifier then add it to the list of modifiers
            if (_isModifier(key)) {
                modifiers.push(key);
            }
        }

        // depending on what the key combination is
        // we will try to pick the best event for it
        action = _pickBestAction(key, modifiers, action);

        return {
            key: key,
            modifiers: modifiers,
            action: action
        };
    }

    function _belongsTo(element, ancestor) {
        if (element === null || element === document) {
            return false;
        }

        if (element === ancestor) {
            return true;
        }

        return _belongsTo(element.parentNode, ancestor);
    }

    function Mousetrap(targetElement) {
        var self = this;

        targetElement = targetElement || document;

        if (!(self instanceof Mousetrap)) {
            return new Mousetrap(targetElement);
        }

        /**
         * element to attach key events to
         *
         * @type {Element}
         */
        self.target = targetElement;

        /**
         * a list of all the callbacks setup via Mousetrap.bind()
         *
         * @type {Object}
         */
        self._callbacks = {};

        /**
         * direct map of string combinations to callbacks used for trigger()
         *
         * @type {Object}
         */
        self._directMap = {};

        /**
         * keeps track of what level each sequence is at since multiple
         * sequences can start out with the same sequence
         *
         * @type {Object}
         */
        var _sequenceLevels = {};

        /**
         * variable to store the setTimeout call
         *
         * @type {null|number}
         */
        var _resetTimer;

        /**
         * temporary state where we will ignore the next keyup
         *
         * @type {boolean|string}
         */
        var _ignoreNextKeyup = false;

        /**
         * temporary state where we will ignore the next keypress
         *
         * @type {boolean}
         */
        var _ignoreNextKeypress = false;

        /**
         * are we currently inside of a sequence?
         * type of action ("keyup" or "keydown" or "keypress") or false
         *
         * @type {boolean|string}
         */
        var _nextExpectedAction = false;

        /**
         * resets all sequence counters except for the ones passed in
         *
         * @param {Object} doNotReset
         * @returns void
         */
        function _resetSequences(doNotReset) {
            doNotReset = doNotReset || {};

            var activeSequences = false,
                key;

            for (key in _sequenceLevels) {
                if (doNotReset[key]) {
                    activeSequences = true;
                    continue;
                }
                _sequenceLevels[key] = 0;
            }

            if (!activeSequences) {
                _nextExpectedAction = false;
            }
        }

        /**
         * finds all callbacks that match based on the keycode, modifiers,
         * and action
         *
         * @param {string} character
         * @param {Array} modifiers
         * @param {Event|Object} e
         * @param {string=} sequenceName - name of the sequence we are looking for
         * @param {string=} combination
         * @param {number=} level
         * @returns {Array}
         */
        function _getMatches(character, modifiers, e, sequenceName, combination, level) {
            var i;
            var callback;
            var matches = [];
            var action = e.type;

            // if there are no events related to this keycode
            if (!self._callbacks[character]) {
                return [];
            }

            // if a modifier key is coming up on its own we should allow it
            if (action == 'keyup' && _isModifier(character)) {
                modifiers = [character];
            }

            // loop through all callbacks for the key that was pressed
            // and see if any of them match
            for (i = 0; i < self._callbacks[character].length; ++i) {
                callback = self._callbacks[character][i];

                // if a sequence name is not specified, but this is a sequence at
                // the wrong level then move onto the next match
                if (!sequenceName && callback.seq && _sequenceLevels[callback.seq] != callback.level) {
                    continue;
                }

                // if the action we are looking for doesn't match the action we got
                // then we should keep going
                if (action != callback.action) {
                    continue;
                }

                // if this is a keypress event and the meta key and control key
                // are not pressed that means that we need to only look at the
                // character, otherwise check the modifiers as well
                //
                // chrome will not fire a keypress if meta or control is down
                // safari will fire a keypress if meta or meta+shift is down
                // firefox will fire a keypress if meta or control is down
                if ((action == 'keypress' && !e.metaKey && !e.ctrlKey) || _modifiersMatch(modifiers, callback.modifiers)) {

                    // when you bind a combination or sequence a second time it
                    // should overwrite the first one.  if a sequenceName or
                    // combination is specified in this call it does just that
                    //
                    // @todo make deleting its own method?
                    var deleteCombo = !sequenceName && callback.combo == combination;
                    var deleteSequence = sequenceName && callback.seq == sequenceName && callback.level == level;
                    if (deleteCombo || deleteSequence) {
                        self._callbacks[character].splice(i, 1);
                    }

                    matches.push(callback);
                }
            }

            return matches;
        }

        /**
         * actually calls the callback function
         *
         * if your callback function returns false this will use the jquery
         * convention - prevent default and stop propogation on the event
         *
         * @param {Function} callback
         * @param {Event} e
         * @returns void
         */
        function _fireCallback(callback, e, combo, sequence) {

            // if this event should not happen stop here
            if (self.stopCallback(e, e.target || e.srcElement, combo, sequence)) {
                return;
            }

            if (callback(e, combo) === false) {
                _preventDefault(e);
                _stopPropagation(e);
            }
        }

        /**
         * handles a character key event
         *
         * @param {string} character
         * @param {Array} modifiers
         * @param {Event} e
         * @returns void
         */
        self._handleKey = function(character, modifiers, e) {
            var callbacks = _getMatches(character, modifiers, e);
            var i;
            var doNotReset = {};
            var maxLevel = 0;
            var processedSequenceCallback = false;

            // Calculate the maxLevel for sequences so we can only execute the longest callback sequence
            for (i = 0; i < callbacks.length; ++i) {
                if (callbacks[i].seq) {
                    maxLevel = Math.max(maxLevel, callbacks[i].level);
                }
            }

            // loop through matching callbacks for this key event
            for (i = 0; i < callbacks.length; ++i) {

                // fire for all sequence callbacks
                // this is because if for example you have multiple sequences
                // bound such as "g i" and "g t" they both need to fire the
                // callback for matching g cause otherwise you can only ever
                // match the first one
                if (callbacks[i].seq) {

                    // only fire callbacks for the maxLevel to prevent
                    // subsequences from also firing
                    //
                    // for example 'a option b' should not cause 'option b' to fire
                    // even though 'option b' is part of the other sequence
                    //
                    // any sequences that do not match here will be discarded
                    // below by the _resetSequences call
                    if (callbacks[i].level != maxLevel) {
                        continue;
                    }

                    processedSequenceCallback = true;

                    // keep a list of which sequences were matches for later
                    doNotReset[callbacks[i].seq] = 1;
                    _fireCallback(callbacks[i].callback, e, callbacks[i].combo, callbacks[i].seq);
                    continue;
                }

                // if there were no sequence matches but we are still here
                // that means this is a regular match so we should fire that
                if (!processedSequenceCallback) {
                    _fireCallback(callbacks[i].callback, e, callbacks[i].combo);
                }
            }

            // if the key you pressed matches the type of sequence without
            // being a modifier (ie "keyup" or "keypress") then we should
            // reset all sequences that were not matched by this event
            //
            // this is so, for example, if you have the sequence "h a t" and you
            // type "h e a r t" it does not match.  in this case the "e" will
            // cause the sequence to reset
            //
            // modifier keys are ignored because you can have a sequence
            // that contains modifiers such as "enter ctrl+space" and in most
            // cases the modifier key will be pressed before the next key
            //
            // also if you have a sequence such as "ctrl+b a" then pressing the
            // "b" key will trigger a "keypress" and a "keydown"
            //
            // the "keydown" is expected when there is a modifier, but the
            // "keypress" ends up matching the _nextExpectedAction since it occurs
            // after and that causes the sequence to reset
            //
            // we ignore keypresses in a sequence that directly follow a keydown
            // for the same character
            var ignoreThisKeypress = e.type == 'keypress' && _ignoreNextKeypress;
            if (e.type == _nextExpectedAction && !_isModifier(character) && !ignoreThisKeypress) {
                _resetSequences(doNotReset);
            }

            _ignoreNextKeypress = processedSequenceCallback && e.type == 'keydown';
        };

        /**
         * handles a keydown event
         *
         * @param {Event} e
         * @returns void
         */
        function _handleKeyEvent(e) {

            // normalize e.which for key events
            // @see http://stackoverflow.com/questions/4285627/javascript-keycode-vs-charcode-utter-confusion
            if (typeof e.which !== 'number') {
                e.which = e.keyCode;
            }

            var character = _characterFromEvent(e);

            // no character found then stop
            if (!character) {
                return;
            }

            // need to use === for the character check because the character can be 0
            if (e.type == 'keyup' && _ignoreNextKeyup === character) {
                _ignoreNextKeyup = false;
                return;
            }

            self.handleKey(character, _eventModifiers(e), e);
        }

        /**
         * called to set a 1 second timeout on the specified sequence
         *
         * this is so after each key press in the sequence you have 1 second
         * to press the next key before you have to start over
         *
         * @returns void
         */
        function _resetSequenceTimer() {
            clearTimeout(_resetTimer);
            _resetTimer = setTimeout(_resetSequences, 1000);
        }

        /**
         * binds a key sequence to an event
         *
         * @param {string} combo - combo specified in bind call
         * @param {Array} keys
         * @param {Function} callback
         * @param {string=} action
         * @returns void
         */
        function _bindSequence(combo, keys, callback, action) {

            // start off by adding a sequence level record for this combination
            // and setting the level to 0
            _sequenceLevels[combo] = 0;

            /**
             * callback to increase the sequence level for this sequence and reset
             * all other sequences that were active
             *
             * @param {string} nextAction
             * @returns {Function}
             */
            function _increaseSequence(nextAction) {
                return function() {
                    _nextExpectedAction = nextAction;
                    ++_sequenceLevels[combo];
                    _resetSequenceTimer();
                };
            }

            /**
             * wraps the specified callback inside of another function in order
             * to reset all sequence counters as soon as this sequence is done
             *
             * @param {Event} e
             * @returns void
             */
            function _callbackAndReset(e) {
                _fireCallback(callback, e, combo);

                // we should ignore the next key up if the action is key down
                // or keypress.  this is so if you finish a sequence and
                // release the key the final key will not trigger a keyup
                if (action !== 'keyup') {
                    _ignoreNextKeyup = _characterFromEvent(e);
                }

                // weird race condition if a sequence ends with the key
                // another sequence begins with
                setTimeout(_resetSequences, 10);
            }

            // loop through keys one at a time and bind the appropriate callback
            // function.  for any key leading up to the final one it should
            // increase the sequence. after the final, it should reset all sequences
            //
            // if an action is specified in the original bind call then that will
            // be used throughout.  otherwise we will pass the action that the
            // next key in the sequence should match.  this allows a sequence
            // to mix and match keypress and keydown events depending on which
            // ones are better suited to the key provided
            for (var i = 0; i < keys.length; ++i) {
                var isFinal = i + 1 === keys.length;
                var wrappedCallback = isFinal ? _callbackAndReset : _increaseSequence(action || _getKeyInfo(keys[i + 1]).action);
                _bindSingle(keys[i], wrappedCallback, action, combo, i);
            }
        }

        /**
         * binds a single keyboard combination
         *
         * @param {string} combination
         * @param {Function} callback
         * @param {string=} action
         * @param {string=} sequenceName - name of sequence if part of sequence
         * @param {number=} level - what part of the sequence the command is
         * @returns void
         */
        function _bindSingle(combination, callback, action, sequenceName, level) {

            // store a direct mapped reference for use with Mousetrap.trigger
            self._directMap[combination + ':' + action] = callback;

            // make sure multiple spaces in a row become a single space
            combination = combination.replace(/\s+/g, ' ');

            var sequence = combination.split(' ');
            var info;

            // if this pattern is a sequence of keys then run through this method
            // to reprocess each pattern one key at a time
            if (sequence.length > 1) {
                _bindSequence(combination, sequence, callback, action);
                return;
            }

            info = _getKeyInfo(combination, action);

            // make sure to initialize array if this is the first time
            // a callback is added for this key
            self._callbacks[info.key] = self._callbacks[info.key] || [];

            // remove an existing match if there is one
            _getMatches(info.key, info.modifiers, {type: info.action}, sequenceName, combination, level);

            // add this call back to the array
            // if it is a sequence put it at the beginning
            // if not put it at the end
            //
            // this is important because the way these are processed expects
            // the sequence ones to come first
            self._callbacks[info.key][sequenceName ? 'unshift' : 'push']({
                callback: callback,
                modifiers: info.modifiers,
                action: info.action,
                seq: sequenceName,
                level: level,
                combo: combination
            });
        }

        /**
         * binds multiple combinations to the same callback
         *
         * @param {Array} combinations
         * @param {Function} callback
         * @param {string|undefined} action
         * @returns void
         */
        self._bindMultiple = function(combinations, callback, action) {
            for (var i = 0; i < combinations.length; ++i) {
                _bindSingle(combinations[i], callback, action);
            }
        };

        // start!
        _addEvent(targetElement, 'keypress', _handleKeyEvent);
        _addEvent(targetElement, 'keydown', _handleKeyEvent);
        _addEvent(targetElement, 'keyup', _handleKeyEvent);
    }

    /**
     * binds an event to mousetrap
     *
     * can be a single key, a combination of keys separated with +,
     * an array of keys, or a sequence of keys separated by spaces
     *
     * be sure to list the modifier keys first to make sure that the
     * correct key ends up getting bound (the last key in the pattern)
     *
     * @param {string|Array} keys
     * @param {Function} callback
     * @param {string=} action - 'keypress', 'keydown', or 'keyup'
     * @returns void
     */
    Mousetrap.prototype.bind = function(keys, callback, action) {
        var self = this;
        keys = keys instanceof Array ? keys : [keys];
        self._bindMultiple.call(self, keys, callback, action);
        return self;
    };

    /**
     * unbinds an event to mousetrap
     *
     * the unbinding sets the callback function of the specified key combo
     * to an empty function and deletes the corresponding key in the
     * _directMap dict.
     *
     * TODO: actually remove this from the _callbacks dictionary instead
     * of binding an empty function
     *
     * the keycombo+action has to be exactly the same as
     * it was defined in the bind method
     *
     * @param {string|Array} keys
     * @param {string} action
     * @returns void
     */
    Mousetrap.prototype.unbind = function(keys, action) {
        var self = this;
        return self.bind.call(self, keys, function() {}, action);
    };

    /**
     * triggers an event that has already been bound
     *
     * @param {string} keys
     * @param {string=} action
     * @returns void
     */
    Mousetrap.prototype.trigger = function(keys, action) {
        var self = this;
        if (self._directMap[keys + ':' + action]) {
            self._directMap[keys + ':' + action]({}, keys);
        }
        return self;
    };

    /**
     * resets the library back to its initial state.  this is useful
     * if you want to clear out the current keyboard shortcuts and bind
     * new ones - for example if you switch to another page
     *
     * @returns void
     */
    Mousetrap.prototype.reset = function() {
        var self = this;
        self._callbacks = {};
        self._directMap = {};
        return self;
    };

    /**
     * should we stop this event before firing off callbacks
     *
     * @param {Event} e
     * @param {Element} element
     * @return {boolean}
     */
    Mousetrap.prototype.stopCallback = function(e, element) {
        var self = this;

        // if the element has the class "mousetrap" then no need to stop
        if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
            return false;
        }

        if (_belongsTo(element, self.target)) {
            return false;
        }

        // stop for input, select, and textarea
        return element.tagName == 'INPUT' || element.tagName == 'SELECT' || element.tagName == 'TEXTAREA' || element.isContentEditable;
    };

    /**
     * exposes _handleKey publicly so it can be overwritten by extensions
     */
    Mousetrap.prototype.handleKey = function() {
        var self = this;
        return self._handleKey.apply(self, arguments);
    };

    /**
     * Init the global mousetrap functions
     *
     * This method is needed to allow the global mousetrap functions to work
     * now that mousetrap is a constructor function.
     */
    Mousetrap.init = function() {
        var documentMousetrap = Mousetrap(document);
        for (var method in documentMousetrap) {
            if (method.charAt(0) !== '_') {
                Mousetrap[method] = (function(method) {
                    return function() {
                        return documentMousetrap[method].apply(documentMousetrap, arguments);
                    };
                } (method));
            }
        }
    };

    Mousetrap.init();

    // expose mousetrap to the global object
    window.Mousetrap = Mousetrap;

    // expose as a common js module
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Mousetrap;
    }

    // expose mousetrap as an AMD module
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return Mousetrap;
        });
    }
}) (window, document);

},{}],"/home/artemis/Documents/apps/table-miner/app/public/react/FileUpload.js":[function(require,module,exports){
var FileUpload = React.createClass({displayName: "FileUpload",
  handleSubmit: function(e){
    e.preventDefault();
    // Show progressbar
    var progress = function(e){
      // show progress bar
      if(e.lengthComputable){
          var max = e.total;
          var current = e.loaded;
          var Percentage = (current * 100)/max;
          $(".progress"+"-meter").width(Percentage+'%')
          $(".progress"+"-meter-text").text(parseInt(Percentage)+'%')
          if(Percentage >= 100)
          {
             // var filename =   $("#filename").text();
             // console.log("finished");
             // process completed
          }
      }
    };
    $("#progressbar")[0].className = "progress";
    var file_data = new FormData(document.getElementById("uploadForm"));
    file_data.append("label", "WEBUPLOAD");
    $.ajax({
      url: "/upload",
      type: "POST",
      data: file_data,
      xhr: function() {
         var settings = $.ajaxSettings.xhr();
         if(settings.upload){
             settings.upload.addEventListener('progress',progress, false);
         }
         return settings;
      },
      enctype: 'multipart/form-data',
      processData: false,
      contentType: false
    }).done(function(data) {
        // run next step here : ask server side
        window.renderFile("uploads/"+data.toString());
        // console.log(window.fileToRender);
    });
  },
  showFilename: function(e){
    e.preventDefault();
    $("#filename").text(e.target.files[0].name);
  },
  render: function() {
    return (
      React.createElement("div", null, 
          React.createElement("h5", null, " Choose a file you want to extract a table from (image or pdf)"), 
          React.createElement("form", {id: "uploadForm", method: "post", encType: "multipart/form-data", onSubmit: this.handleSubmit}, 
            React.createElement("label", {className: "button hollow"}, 
              React.createElement("input", {className: "hide", type: "file", name: "toConvert", onChange: this.showFilename}), 
              React.createElement("span", null, " Select a file ")
            ), 
            React.createElement("input", {className: "button", type: "submit", value: "Upload", name: "submit"}), 
            React.createElement("label", {id: "filename"})
          ), 
          React.createElement("div", {id: "progressbar", className: "progress hide", role: "progressbar"}, 
            React.createElement("div", {className: "progress-meter"}, 
              React.createElement("p", {className: "progress-meter-text"}, " 0 % ")
            )
          )
      )
    );
  }
});

module.exports = FileUpload;

},{}],"/home/artemis/Documents/apps/table-miner/app/public/react/Image.js":[function(require,module,exports){
var Image = React.createClass({displayName: "Image",
  componentDidMount: function(){
    console.log("Mounted");
    var img = $(".img-layer");
    img.on('load', function(){
      console.log("Ready ...");
      $("#canvasLayer").attr({"height":img.height()+"px", "width":img.width()+"px"});
    });

  },
  render: function() {
    return (
        React.createElement("div", {className: "center margin"}, 
          React.createElement("div", {className: "small-12 large-12 medium-12 columns"}, 
            React.createElement("h5", null, " Choose area of interest ... and ", React.createElement("button", {id: "validate", className: "button hollow"}, " Validate "), " ")
          ), 
          React.createElement("div", {className: "small-12 large-12 medium-12 columns"}, 
            React.createElement("img", {className: "img-layer thumbnail", src: this.props.source}), 
            React.createElement("canvas", {className: "canvas-layer", id: "canvasLayer"}
            )
          )
        )
    );
  }
});

module.exports = Image;

},{}],"/home/artemis/Documents/apps/table-miner/app/public/react/Spreadsheet/cell.js":[function(require,module,exports){
"use strict";

var Dispatcher = require('./dispatcher');
var Helpers = require('./helpers');

var CellComponent = React.createClass({displayName: "CellComponent",

    /**
     * React "getInitialState" method, setting whether or not
     * the cell is being edited and its changing value
     */
    getInitialState: function() {
        return {
            editing: this.props.editing,
            changedValue: this.props.value
        };
    },

    /**
     * React "render" method, rendering the individual cell
     */
    render: function() {
        var selected = (this.props.selected) ? 'selected' : '',
            ref = 'input_' + this.props.uid.join('_'),
            emptyValueSymbol = this.props.config.emptyValueSymbol || '',
            displayValue = (this.props.value === '' || !this.props.value) ? emptyValueSymbol : this.props.value,
            cellClasses = (this.props.cellClasses.length > 0) ? this.props.cellClasses + ' ' + selected : selected,
            cellContent;

        // Check if header - if yes, render it
        var header = this.renderHeader();
        if (header) {
            return header;
        }

        // If not a header, check for editing and return
        if (this.props.selected && this.props.editing) {
            cellContent = (
                React.createElement("input", {className: "mousetrap", 
                       onChange: this.handleChange, 
                       onBlur: this.handleBlur, 
                       ref: ref, 
                       defaultValue: this.props.value})
            )
        }

        return (
            React.createElement("td", {className: cellClasses, ref: this.props.uid.join('_')}, 
                React.createElement("div", {className: "reactTableCell"}, 
                    cellContent, 
                    React.createElement("span", {onDoubleClick: this.handleDoubleClick, onClick: this.handleClick}, 
                        displayValue
                    )
                )
            )
        );
    },

    /**
     * React "componentDidUpdate" method, ensuring correct input focus
     * @param  {React previous properties} prevProps
     * @param  {React previous state} prevState
     */
    componentDidUpdate: function(prevProps, prevState) {
        if (this.props.editing && this.props.selected) {
            var node = ReactDOM.findDOMNode(this.refs['input_' + this.props.uid.join('_')]);
            node.focus();
        }

        if (prevProps.selected && prevProps.editing && this.state.changedValue !== this.props.value) {
            this.props.onCellValueChange(this.props.uid, this.state.changedValue);
        }
    },

    /**
     * Click handler for individual cell, ensuring navigation and selection
     * @param  {event} e
     */
    handleClick: function (e) {
        var cellElement = ReactDOM.findDOMNode(this.refs[this.props.uid.join('_')]);
        this.props.handleSelectCell(this.props.uid, cellElement);
    },

    /**
     * Click handler for individual cell if the cell is a header cell
     * @param  {event} e
     */
    handleHeadClick: function (e) {
        var cellElement = ReactDOM.findDOMNode(this.refs[this.props.uid.join('_')]);
        Dispatcher.publish('headCellClicked', cellElement, this.props.spreadsheetId);
    },

    /**
     * Double click handler for individual cell, ensuring navigation and selection
     * @param  {event} e
     */
    handleDoubleClick: function (e) {
        e.preventDefault();
        this.props.handleDoubleClickOnCell(this.props.uid);
    },

    /**
     * Blur handler for individual cell
     * @param  {event} e
     */
    handleBlur: function (e) {
        var newValue = ReactDOM.findDOMNode(this.refs['input_' + this.props.uid.join('_')]).value;

        this.props.onCellValueChange(this.props.uid, newValue, e);
        this.props.handleCellBlur(this.props.uid);
        Dispatcher.publish('cellBlurred', this.props.uid, this.props.spreadsheetId);
    },

    /**
     * Change handler for an individual cell, propagating the value change
     * @param  {event} e
     */
    handleChange: function (e) {
        var newValue = ReactDOM.findDOMNode(this.refs['input_' + this.props.uid.join('_')]).value;

        this.setState({changedValue: newValue});
    },

    /**
     * Checks if a header exists - if it does, it returns a header object
     * @return {false|react} [Either false if it's not a header cell, a react object if it is]
     */
    renderHeader: function () {
        var selected = (this.props.selected) ? 'selected' : '',
            uid = this.props.uid,
            config = this.props.config,
            emptyValueSymbol = this.props.config.emptyValueSymbol || '',
            displayValue = (this.props.value === '' || !this.props.value) ? emptyValueSymbol : this.props.value,
            cellClasses = (this.props.cellClasses.length > 0) ? this.props.cellClasses + ' ' + selected : selected;

        // Cases
        var headRow = (uid[0] === 0),
            headColumn = (uid[1] === 0),
            headRowAndEnabled = (config.hasHeadRow && uid[0] === 0),
            headColumnAndEnabled = (config.hasHeadColumn && uid[1] === 0)

        // Head Row enabled, cell is in head row
        // Head Column enabled, cell is in head column
        if (headRowAndEnabled || headColumnAndEnabled) {
            if (headColumn && config.hasLetterNumberHeads) {
                displayValue = uid[0];
            } else if (headRow && config.hasLetterNumberHeads) {
                displayValue = Helpers.countWithLetters(uid[1]);
            }

            if ((config.isHeadRowString && headRow) || (config.isHeadColumnString && headColumn)) {
                return (
                    React.createElement("th", {className: cellClasses, ref: this.props.uid.join('_')}, 
                        React.createElement("div", null, 
                            React.createElement("span", {onClick: this.handleHeadClick}, 
                                displayValue
                            )
                        )
                    )
                );
            } else {
                return (
                    React.createElement("th", {ref: this.props.uid.join('_')}, 
                        displayValue
                    )
                );
            }
        } else {
            return false;
        }
    }
});

module.exports = CellComponent;

},{"./dispatcher":"/home/artemis/Documents/apps/table-miner/app/public/react/Spreadsheet/dispatcher.js","./helpers":"/home/artemis/Documents/apps/table-miner/app/public/react/Spreadsheet/helpers.js"}],"/home/artemis/Documents/apps/table-miner/app/public/react/Spreadsheet/dispatcher.js":[function(require,module,exports){
"use strict";

var Mousetrap = require('mousetrap');

var dispatcher = {
    // Event Pub/Sub System
    //
    // Topics used:
    // [headCellClicked] - A head cell was clicked
    //      @return {array} [row, column]
    // [cellSelected] - A cell was selected
    //      @return {array} [row, column]
    // [cellBlur] - A cell was blurred
    //      @return {array} [row, column]
    // [cellValueChanged] - A cell value changed.
    //      @return {cell, newValue} Origin cell, new value entered
    // [dataChanged] - Data changed
    //      @return {data} New data
    // [editStarted] - The user started editing
    //      @return {cell} Origin cell
    // [editStopped] - The user stopped editing
    //      @return {cell} Origin cell
    // [rowCreated] - The user created a row
    //      @return {number} Row index
    // [columnCreated] - The user created a column
    //      @return {number} Column index
    topics: {},

    /**
     * Subscribe to an event
     * @param  {string} topic         [The topic subscribing to]
     * @param  {function} listener    [The callback for published events]
     * @param  {string} spreadsheetId [The reactId (data-spreadsheetId) of the origin element]
     */
    subscribe: function(topic, listener, spreadsheetId) {
        if (!this.topics[spreadsheetId]) {
            this.topics[spreadsheetId] = [];
        }

        if (!this.topics[spreadsheetId][topic]) {
            this.topics[spreadsheetId][topic] = [];
        }

        this.topics[spreadsheetId][topic].push(listener);
    },

    /**
     * Publish to an event channel
     * @param  {string} topic         [The topic publishing to]
     * @param  {object} data          [An object passed to the subscribed callbacks]
     * @param  {string} spreadsheetId [The reactId (data-spreadsheetId) of the origin element]
     */
    publish: function(topic, data, spreadsheetId) {
        // return if the topic doesn't exist, or there are no listeners
        if (!this.topics[spreadsheetId] || !this.topics[spreadsheetId][topic] || this.topics[spreadsheetId][topic].length < 1) {
            return
        }

        this.topics[spreadsheetId][topic].forEach(function(listener) {
            listener(data || {});
        });
    },

    keyboardShortcuts: [
        // Name, Keys, Events
        ['down', 'down', ['keyup']],
        ['up', 'up', ['keyup']],
        ['left', 'left', ['keyup']],
        ['right', 'right', ['keyup']],
        ['tab', 'tab', ['keyup', 'keydown']],
        ['enter', 'enter', ['keyup']],
        ['esc', 'esc', ['keyup']],
        ['remove', ['backspace', 'delete'], ['keyup', 'keydown']],
        ['letter', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'w', 'y', 'z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '=', '.', ',', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'W', 'Y', 'Z'], ['keyup', 'keydown']]
    ],

    /**
     * Initializes the keyboard bindings
     * @param {object} domNode [The DOM node of the element that should be bound]
     * @param {string} spreadsheetId [The id of the spreadsheet element]
     */
    setupKeyboardShortcuts: function (domNode, spreadsheetId) {
        var self = this;

        this.keyboardShortcuts.map(function (shortcut) {
            var shortcutName = shortcut[0],
                shortcutKey = shortcut[1],
                events = shortcut[2];

            events.map(event => {
                Mousetrap(domNode).bind(shortcutKey, function (e) {
                    self.publish(shortcutName + '_' + event, e, spreadsheetId);
                }, event);
            })
        });

        // Avoid scroll
        window.addEventListener('keydown', function(e) {
            // space and arrow keys
            if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1 && $(document.activeElement)[0].tagName !== 'INPUT') {
                if (e.preventDefault) {
                    e.preventDefault();
                } else {
                    // Oh, old IE, you 💩
                    e.returnValue = false;
                }
            }
        }, false);
    }
};

module.exports = dispatcher;

},{"mousetrap":"/home/artemis/Documents/apps/table-miner/app/node_modules/mousetrap/mousetrap.js"}],"/home/artemis/Documents/apps/table-miner/app/public/react/Spreadsheet/helpers.js":[function(require,module,exports){
"use strict";

var Helpers = {
    /**
     * Find the first element in an array matching a boolean
     * @param  {[array]} arr     [Array to test]
     * @param  {[function]} test [Test Function]
     * @param  {[type]} context  [Context]
     * @return {[object]}        [Found element]
     */
    firstInArray: function (arr, test, context) {
        var result = null;

        arr.some(function(el, i) {
            return test.call(context, el, i, arr) ? ((result = el), true) : false;
        });

        return result;
    },

    /**
     * Find the first TD in a path array
     * @param  {[array]} arr  [Path array containing elements]
     * @return {[object]}     [Found element]
     */
    firstTDinArray: function (arr) {
        var cell = Helpers.firstInArray(arr, function (element) {
            if (element.nodeName && element.nodeName === 'TD') {
                return true;
            } else {
                return false;
            }
        });

        return cell;
    },

    /**
     * Check if two cell objects reference the same cell
     * @param  {[array]} cell1 [First cell]
     * @param  {[array]} cell2 [Second cell]
     * @return {[boolean]}    [Boolean indicating if the cells are equal]
     */
    equalCells: function (cell1, cell2) {
        if (!cell1 || !cell2 || cell1.length !== cell2.length) {
            return false;
        }

        if (cell1[0] === cell2[0] && cell1[1] === cell2[1]) {
            return true;
        } else {
            return false;
        }
    },

    /**
     * Counts in letters (A, B, C...Z, AA);
     * @return {[string]} [Letter]
     */
    countWithLetters: function (num) {
        var mod = num % 26,
            pow = num / 26 | 0,
            out = mod ? String.fromCharCode(64 + mod) : (--pow, 'Z');
        return pow ? this.countWithLetters(pow) + out : out;
    },

    /**
     * Creates a random 5-character id
     * @return {string} [Somewhat random id]
     */
    makeSpreadsheetId: function()
    {
        var text = '',
            possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < 5; i = i + 1) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }
}

module.exports = Helpers;

},{}],"/home/artemis/Documents/apps/table-miner/app/public/react/Spreadsheet/row.js":[function(require,module,exports){
"use strict";

var CellComponent = require('./cell');
var Helpers = require('./helpers');

var RowComponent = React.createClass({displayName: "RowComponent",
    /**
     * React Render method
     * @return {[JSX]} [JSX to render]
     */
    render: function() {
        var config = this.props.config,
            cells = this.props.cells,
            columns = [],
            key, uid, selected, cellClasses, i;

        if (!config.columns || cells.length === 0) {
            return console.error('Table can\'t be initialized without set number of columsn and no data!');
        }

        for (i = 0; i < cells.length; i = i + 1) {
            // If a cell is selected, check if it's this one
            selected = Helpers.equalCells(this.props.selected, [this.props.uid, i]);
            cellClasses = (this.props.cellClasses && this.props.cellClasses[i]) ? this.props.cellClasses[i] : '';

            key = 'row_' + this.props.uid + '_cell_' + i;
            uid = [this.props.uid, i];
            columns.push(React.createElement(CellComponent, {key: key, 
                                       uid: uid, 
                                       value: cells[i], 
                                       config: config, 
                                       cellClasses: cellClasses, 
                                       onCellValueChange: this.props.onCellValueChange, 
                                       handleSelectCell: this.props.handleSelectCell, 
                                       handleDoubleClickOnCell: this.props.handleDoubleClickOnCell, 
                                       handleCellBlur: this.props.handleCellBlur, 
                                       spreadsheetId: this.props.spreadsheetId, 
                                       selected: selected, 
                                       editing: this.props.editing})
            );
        }

        return React.createElement("tr", null, columns);
    }
});

module.exports = RowComponent;

},{"./cell":"/home/artemis/Documents/apps/table-miner/app/public/react/Spreadsheet/cell.js","./helpers":"/home/artemis/Documents/apps/table-miner/app/public/react/Spreadsheet/helpers.js"}],"/home/artemis/Documents/apps/table-miner/app/public/react/Spreadsheet/spreadsheet.js":[function(require,module,exports){
"use strict";

var RowComponent = require('./row');
var Dispatcher = require('./dispatcher');
var Helpers = require('./helpers');

var SpreadsheetComponent = React.createClass({displayName: "SpreadsheetComponent",
    spreadsheetId: null,

    /**
     * React 'getInitialState' method
     */
    getInitialState: function() {
        var initialData = this.props.initialData || {};

        if (!initialData.rows) {
            initialData.rows = [];

            for (var i = 0; i < this.props.config.rows; i = i + 1) {
                initialData.rows[i] = [];
                for (var ci = 0; ci < this.props.config.columns; ci = ci + 1) {
                    initialData.rows[i][ci] = '';
                }
            }
        }

        return {
            data: initialData,
            selected: null,
            lastBlurred: null,
            selectedElement: null,
            editing: false
        };
    },

    /**
     * React 'componentDidMount' method
     */
    componentDidMount: function () {
        this.bindKeyboard();

        $('body').on('focus', 'input', function (e) {
            $(this)
                .one('mouseup', function () {
                    $(this).select();
                    return false;
                })
                .select();
        });
    },

    /**
     * React Render method
     * @return {[JSX]} [JSX to render]
     */
    render: function() {
        var data = this.state.data,
            config = this.props.config,
            _cellClasses = this.props.cellClasses,
            rows = [], key, i, cellClasses;

        this.spreadsheetId = this.props.spreadsheetId || Helpers.makeSpreadsheetId();

        // Sanity checks
        if (!data.rows && !config.rows) {
            return console.error('Table Component: Number of colums not defined in both data and config!');
        }

        // Create Rows
        for (i = 0; i < data.rows.length; i = i + 1) {
            key = 'row_' + i;
            cellClasses = (_cellClasses && _cellClasses.rows && _cellClasses.rows[i]) ? _cellClasses.rows[i] : null;

            rows.push(React.createElement(RowComponent, {cells: data.rows[i], 
                                    cellClasses: cellClasses, 
                                    uid: i, 
                                    key: key, 
                                    config: config, 
                                    selected: this.state.selected, 
                                    editing: this.state.editing, 
                                    handleSelectCell: this.handleSelectCell, 
                                    handleDoubleClickOnCell: this.handleDoubleClickOnCell, 
                                    handleCellBlur: this.handleCellBlur, 
                                    onCellValueChange: this.handleCellValueChange, 
                                    spreadsheetId: this.spreadsheetId, 
                                    className: "cellComponent"}));
        }

        return (
            React.createElement("table", {tabIndex: "0", "data-spreasheet-id": this.spreadsheetId}, 
                React.createElement("tbody", null, 
                    rows
                )
            )
        );
    },

    /**
     * Binds the various keyboard events dispatched to table functions
     */
    bindKeyboard: function () {
        Dispatcher.setupKeyboardShortcuts($(ReactDOM.findDOMNode(this))[0], this.spreadsheetId);

        Dispatcher.subscribe('up_keyup', data => {
            this.navigateTable('up', data);
        }, this.spreadsheetId);
        Dispatcher.subscribe('down_keyup', data => {
            this.navigateTable('down', data);
        }, this.spreadsheetId);
        Dispatcher.subscribe('left_keyup', data => {
            this.navigateTable('left', data);
        }, this.spreadsheetId);
        Dispatcher.subscribe('right_keyup', data => {
            this.navigateTable('right', data);
        }, this.spreadsheetId);
        Dispatcher.subscribe('tab_keyup', data => {
            this.navigateTable('right', data, null, true);
        }, this.spreadsheetId);

        // Prevent brower's from jumping to URL bar
        Dispatcher.subscribe('tab_keydown', data => {
            if ($(document.activeElement) && $(document.activeElement)[0].tagName === 'INPUT') {
                if (data.preventDefault) {
                    data.preventDefault();
                } else {
                    // Oh, old IE, you 💩
                    data.returnValue = false;
                }
            }
        }, this.spreadsheetId);

        Dispatcher.subscribe('remove_keydown', data => {
            if (!$(data.target).is('input, textarea')) {
                if (data.preventDefault) {
                    data.preventDefault();
                } else {
                    // Oh, old IE, you 💩
                    data.returnValue = false;
                }
            }
        }, this.spreadsheetId);

        Dispatcher.subscribe('enter_keyup', () => {
            if (this.state.selectedElement) {
                this.setState({editing: !this.state.editing});
            }
            $(ReactDOM.findDOMNode(this)).first().focus();
        }, this.spreadsheetId);

        // Go into edit mode when the user starts typing on a field
        Dispatcher.subscribe('letter_keydown', () => {
            if (!this.state.editing && this.state.selectedElement) {
                Dispatcher.publish('editStarted', this.state.selectedElement, this.spreadsheetId);
                this.setState({editing: true});
            }
        }, this.spreadsheetId);

        // Delete on backspace and delete
        Dispatcher.subscribe('remove_keyup', () => {
            if (this.state.selected && !Helpers.equalCells(this.state.selected, this.state.lastBlurred)) {
                this.handleCellValueChange(this.state.selected, '');
            }
        }, this.spreadsheetId);
    },

    /**
     * Navigates the table and moves selection
     * @param  {string} direction                               [Direction ('up' || 'down' || 'left' || 'right')]
     * @param  {Array: [number: row, number: cell]} originCell  [Origin Cell]
     * @param  {boolean} inEdit                                 [Currently editing]
     */
    navigateTable: function (direction, data, originCell, inEdit) {
        // Only traverse the table if the user isn't editing a cell,
        // unless override is given
        if (!inEdit && this.state.editing) {
            return false;
        }

        // Use the curently active cell if one isn't passed
        if (!originCell) {
            originCell = this.state.selectedElement;
        }

        // Prevent default
        if (data.preventDefault) {
            data.preventDefault();
        } else {
            // Oh, old IE, you 💩
            data.returnValue = false;
        }

        var $origin = $(originCell),
            cellIndex = $origin.index(),
            target;

        if (direction === 'up') {
            target = $origin.closest('tr').prev().children().eq(cellIndex).find('span');
        } else if (direction === 'down') {
            target = $origin.closest('tr').next().children().eq(cellIndex).find('span');
        } else if (direction === 'left') {
            target = $origin.closest('td').prev().find('span');
        } else if (direction === 'right') {
            target = $origin.closest('td').next().find('span');
        }

        if (target.length > 0) {
            target.click();
        } else {
            this.extendTable(direction, originCell);
        }
    },

    /**
     * Extends the table with an additional row/column, if permitted by config
     * @param  {string} direction [Direction ('up' || 'down' || 'left' || 'right')]
     */
    extendTable: function (direction) {
        var config = this.props.config,
            data = this.state.data,
            newRow, i;

        if (direction === 'down' && config.canAddRow) {
            newRow = [];

            for (i = 0; i < this.state.data.rows[0].length; i = i + 1) {
                newRow[i] = '';
            }

            data.rows.push(newRow);
            Dispatcher.publish('rowCreated', data.rows.length, this.spreadsheetId);
            return this.setState({data: data});
        }

        if (direction === 'right' && config.canAddColumn) {
            for (i = 0; i < data.rows.length; i = i + 1) {
                data.rows[i].push('');
            }

            Dispatcher.publish('columnCreated', data.rows[0].length, this.spreadsheetId);
            return this.setState({data: data});
        }

    },

    /**
     * Callback for 'selectCell', updating the selected Cell
     * @param  {Array: [number: row, number: cell]} cell [Selected Cell]
     * @param  {object} cellElement [Selected Cell Element]
     */
    handleSelectCell: function (cell, cellElement) {
        Dispatcher.publish('cellSelected', cell, this.spreadsheetId);
        $(ReactDOM.findDOMNode(this)).first().focus();

        this.setState({
            selected: cell,
            selectedElement: cellElement
        });
    },

    /**
     * Callback for 'cellValueChange', updating the cell data
     * @param  {Array: [number: row, number: cell]} cell [Selected Cell]
     * @param  {object} newValue                         [Value to set]
     */
    handleCellValueChange: function (cell, newValue) {
        var data = this.state.data,
            row = cell[0],
            column = cell[1],
            oldValue = data.rows[row][column];

        Dispatcher.publish('cellValueChanged', [cell, newValue, oldValue], this.spreadsheetId);

        data.rows[row][column] = newValue;
        this.setState({
            data: data
        });

        Dispatcher.publish('dataChanged', data, this.spreadsheetId);
    },

    /**
     * Callback for 'doubleClickonCell', enabling 'edit' mode
     */
    handleDoubleClickOnCell: function () {
        this.setState({
            editing: true
        });
    },

    /**
     * Callback for 'cellBlur'
     */
    handleCellBlur: function (cell) {
        if (this.state.editing) {
            Dispatcher.publish('editStopped', this.state.selectedElement);
        }

        this.setState({
            editing: false,
            lastBlurred: cell
        });
    }
});

module.exports = SpreadsheetComponent;

},{"./dispatcher":"/home/artemis/Documents/apps/table-miner/app/public/react/Spreadsheet/dispatcher.js","./helpers":"/home/artemis/Documents/apps/table-miner/app/public/react/Spreadsheet/helpers.js","./row":"/home/artemis/Documents/apps/table-miner/app/public/react/Spreadsheet/row.js"}],"/home/artemis/Documents/apps/table-miner/app/public/react/main.js":[function(require,module,exports){
var socket = io();
// js
window.fileToRender = "";

window.renderFile = function(str){
  // send data to server socket once the image is loaded
  obj = {
    "socketID":socket.id,
    "filename":str
  };
  socket.emit('requestContentBox', JSON.stringify(obj))
  // render
  window.fileToRender = str;
  ReactDOM.render(
    React.createElement(Image, {source: str}),
    document.getElementById('content')
  );
};
// Load React classes
var Image = require('./Image');

var FileUpload = require('./FileUpload');

var SpreadsheetComponent = require('./Spreadsheet/spreadsheet');

// Default rendering
ReactDOM.render(
  React.createElement(FileUpload, null),
  document.getElementById('content')
);

// Display csv file
socket.on('csvFilepath', function(msg){
  console.log(msg);
  rows = msg.length - 1;
  columns = msg[0].length;
  var config = {
    // Initial number of row
    rows: rows,
    // Initial number of columns
    columns: columns,
    // True if the first column in each row is a header (th)
    hasHeadColumn: false,
    // True if the data for the first column is just a string.
    // Set to false if you want to pass custom DOM elements.
    isHeadColumnString: true,
    // True if the first row is a header (th)
    hasHeadRow: false,
    // True if the data for the cells in the first row contains strings.
    // Set to false if you want to pass custom DOM elements.
    isHeadRowString: true,
    // True if the user can add rows (by navigating down from the last row)
    canAddRow: false,
    // True if the user can add columns (by navigating right from the last column)
    canAddColumn: false,
    // Override the display value for an empty cell
    emptyValueSymbol: '-',
    // Fills the first column with index numbers (1...n) and the first row with index letters (A...ZZZ)
    hasLetterNumberHeads: true
  };
  initialData = [];
  for (var i = 0; i < msg.length - 1; i++) {
    initialData.push(msg[i])
  }
  // set data
  var data = {
    rows: initialData
  };
  // render
  ReactDOM.render(
   React.createElement(SpreadsheetComponent, {initialData: data, config: config, spreadsheetId: "1"}),
   document.getElementById('content')
  );
});

// Display Content boxes
socket.on('contentBox', function(msg){
  console.log(msg);
  var canvasLayer = $("#canvasLayer")[0];
  var ctx = canvasLayer.getContext("2d");
  var draw = function(){
    ctx.clearRect(0,0,canvasLayer.width,canvasLayer.height);
    msg["data"].forEach(function(elt){
      var top = elt["pos"][0];
      var bot = elt["pos"][1];
      var width = bot["x"] - top["x"];
      var height = bot["y"] - top["y"];
      ctx.lineWidth = 2;
      ctx.strokeRect(top["x"], top["y"], width, height)
      if (elt["class"][0] == "0.0"){
        ctx.fillStyle="rgba(243, 228, 0, 0.55)"
        ctx.fillRect(top["x"],top["y"],
        bot["x"] - top["x"],bot["y"] - top["y"])
      }
    });
  }
  // Draw boxes
  draw()
  // listen for mouse position and highlight the area
  // hightlight for good when clicked
  $("#canvasLayer").on('mousemove', function(event){
    bound = canvasLayer.getBoundingClientRect()
    cX = event.clientX - bound.left
    cY = event.clientY - bound.top
    draw()
    msg["data"].forEach(function(elt){
      var top = elt["pos"][0];
      var bot = elt["pos"][1];
      var width = bot["x"] - top["x"];
      var height = bot["y"] - top["y"];
      ctx.lineWidth = 2;
      ctx.strokeRect(top["x"], top["y"], width, height)
      if (cX >= top["x"] && cX <= bot["x"] &&
      cY >= top["y"] && cY <= bot["y"]){
          if (elt["class"][0] == "1.0"){
            ctx.fillStyle="rgba(243, 228, 103, 0.55)"
            ctx.fillRect(top["x"],top["y"],
            bot["x"] - top["x"],bot["y"] - top["y"])
          }
      }
    });
  });
  $("#canvasLayer").on('click', function(event){
    bound = canvasLayer.getBoundingClientRect()
    cX = event.clientX - bound.left
    cY = event.clientY - bound.top
    draw()
    msg["data"].forEach(function(elt){
      var top = elt["pos"][0];
      var bot = elt["pos"][1];
      var width = bot["x"] - top["x"];
      var height = bot["y"] - top["y"];
      ctx.lineWidth = 2;
      ctx.strokeRect(top["x"], top["y"], width, height)
      if (cX >= top["x"] && cX <= bot["x"] &&
      cY >= top["y"] && cY <= bot["y"]){
          if (elt["class"][0] == "1.0"){
            elt["class"][0] = "0.0"
            elt["class"][1] = "1.0"
            ctx.fillStyle="rgba(243, 228, 0, 0.55)"
            ctx.fillRect(top["x"],top["y"],
            bot["x"] - top["x"],bot["y"] - top["y"])
          }
          else if (elt["class"][0] == "0.0") {
            elt["class"][0] = "1.0"
            elt["class"][1] = "0.0"
          }
      }
    });
  });
  // On click on validate : emit event to nodejs server
  $("#validate").on("click", function(){
    $("#validate")[0].className="button hollow disabled";
    obj = {
      "socketID":socket.id,
      "filename":window.fileToRender,
      "contentBoxes":msg
    };
    socket.emit('requestCsv', JSON.stringify(obj));
    // remove mousemove and click event
    $("#canvasLaer").off()
    $("#validate").off()
  });
});

},{"./FileUpload":"/home/artemis/Documents/apps/table-miner/app/public/react/FileUpload.js","./Image":"/home/artemis/Documents/apps/table-miner/app/public/react/Image.js","./Spreadsheet/spreadsheet":"/home/artemis/Documents/apps/table-miner/app/public/react/Spreadsheet/spreadsheet.js"}]},{},["/home/artemis/Documents/apps/table-miner/app/public/react/main.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvbm9kZV9tb2R1bGVzL21vdXNldHJhcC9tb3VzZXRyYXAuanMiLCIvaG9tZS9hcnRlbWlzL0RvY3VtZW50cy9hcHBzL3RhYmxlLW1pbmVyL2FwcC9wdWJsaWMvcmVhY3QvRmlsZVVwbG9hZC5qcyIsIi9ob21lL2FydGVtaXMvRG9jdW1lbnRzL2FwcHMvdGFibGUtbWluZXIvYXBwL3B1YmxpYy9yZWFjdC9JbWFnZS5qcyIsIi9ob21lL2FydGVtaXMvRG9jdW1lbnRzL2FwcHMvdGFibGUtbWluZXIvYXBwL3B1YmxpYy9yZWFjdC9TcHJlYWRzaGVldC9jZWxsLmpzIiwiL2hvbWUvYXJ0ZW1pcy9Eb2N1bWVudHMvYXBwcy90YWJsZS1taW5lci9hcHAvcHVibGljL3JlYWN0L1NwcmVhZHNoZWV0L2Rpc3BhdGNoZXIuanMiLCIvaG9tZS9hcnRlbWlzL0RvY3VtZW50cy9hcHBzL3RhYmxlLW1pbmVyL2FwcC9wdWJsaWMvcmVhY3QvU3ByZWFkc2hlZXQvaGVscGVycy5qcyIsIi9ob21lL2FydGVtaXMvRG9jdW1lbnRzL2FwcHMvdGFibGUtbWluZXIvYXBwL3B1YmxpYy9yZWFjdC9TcHJlYWRzaGVldC9yb3cuanMiLCIvaG9tZS9hcnRlbWlzL0RvY3VtZW50cy9hcHBzL3RhYmxlLW1pbmVyL2FwcC9wdWJsaWMvcmVhY3QvU3ByZWFkc2hlZXQvc3ByZWFkc2hlZXQuanMiLCIvaG9tZS9hcnRlbWlzL0RvY3VtZW50cy9hcHBzL3RhYmxlLW1pbmVyL2FwcC9wdWJsaWMvcmVhY3QvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUFFLEtBQUssRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNwQyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM3QixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN6QixDQUFDLFFBQVEsRUFBRSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN6RCxDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENB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QUM5QixjQUFjLENBQUMsR0FBRztLQUNuQixDQUFDO0FBQ04sSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7O0lBRS9DLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDdEIsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsRUFBRTtHQUNyQixDQUFDLENBQUM7Q0FDSixDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypnbG9iYWwgZGVmaW5lOmZhbHNlICovXG4vKipcbiAqIENvcHlyaWdodCAyMDE1IENyYWlnIENhbXBiZWxsXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICogTW91c2V0cmFwIGlzIGEgc2ltcGxlIGtleWJvYXJkIHNob3J0Y3V0IGxpYnJhcnkgZm9yIEphdmFzY3JpcHQgd2l0aFxuICogbm8gZXh0ZXJuYWwgZGVwZW5kZW5jaWVzXG4gKlxuICogQHZlcnNpb24gMS41LjNcbiAqIEB1cmwgY3JhaWcuaXMva2lsbGluZy9taWNlXG4gKi9cbihmdW5jdGlvbih3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQpIHtcblxuICAgIC8qKlxuICAgICAqIG1hcHBpbmcgb2Ygc3BlY2lhbCBrZXljb2RlcyB0byB0aGVpciBjb3JyZXNwb25kaW5nIGtleXNcbiAgICAgKlxuICAgICAqIGV2ZXJ5dGhpbmcgaW4gdGhpcyBkaWN0aW9uYXJ5IGNhbm5vdCB1c2Uga2V5cHJlc3MgZXZlbnRzXG4gICAgICogc28gaXQgaGFzIHRvIGJlIGhlcmUgdG8gbWFwIHRvIHRoZSBjb3JyZWN0IGtleWNvZGVzIGZvclxuICAgICAqIGtleXVwL2tleWRvd24gZXZlbnRzXG4gICAgICpcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHZhciBfTUFQID0ge1xuICAgICAgICA4OiAnYmFja3NwYWNlJyxcbiAgICAgICAgOTogJ3RhYicsXG4gICAgICAgIDEzOiAnZW50ZXInLFxuICAgICAgICAxNjogJ3NoaWZ0JyxcbiAgICAgICAgMTc6ICdjdHJsJyxcbiAgICAgICAgMTg6ICdhbHQnLFxuICAgICAgICAyMDogJ2NhcHNsb2NrJyxcbiAgICAgICAgMjc6ICdlc2MnLFxuICAgICAgICAzMjogJ3NwYWNlJyxcbiAgICAgICAgMzM6ICdwYWdldXAnLFxuICAgICAgICAzNDogJ3BhZ2Vkb3duJyxcbiAgICAgICAgMzU6ICdlbmQnLFxuICAgICAgICAzNjogJ2hvbWUnLFxuICAgICAgICAzNzogJ2xlZnQnLFxuICAgICAgICAzODogJ3VwJyxcbiAgICAgICAgMzk6ICdyaWdodCcsXG4gICAgICAgIDQwOiAnZG93bicsXG4gICAgICAgIDQ1OiAnaW5zJyxcbiAgICAgICAgNDY6ICdkZWwnLFxuICAgICAgICA5MTogJ21ldGEnLFxuICAgICAgICA5MzogJ21ldGEnLFxuICAgICAgICAyMjQ6ICdtZXRhJ1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBtYXBwaW5nIGZvciBzcGVjaWFsIGNoYXJhY3RlcnMgc28gdGhleSBjYW4gc3VwcG9ydFxuICAgICAqXG4gICAgICogdGhpcyBkaWN0aW9uYXJ5IGlzIG9ubHkgdXNlZCBpbmNhc2UgeW91IHdhbnQgdG8gYmluZCBhXG4gICAgICoga2V5dXAgb3Iga2V5ZG93biBldmVudCB0byBvbmUgb2YgdGhlc2Uga2V5c1xuICAgICAqXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICB2YXIgX0tFWUNPREVfTUFQID0ge1xuICAgICAgICAxMDY6ICcqJyxcbiAgICAgICAgMTA3OiAnKycsXG4gICAgICAgIDEwOTogJy0nLFxuICAgICAgICAxMTA6ICcuJyxcbiAgICAgICAgMTExIDogJy8nLFxuICAgICAgICAxODY6ICc7JyxcbiAgICAgICAgMTg3OiAnPScsXG4gICAgICAgIDE4ODogJywnLFxuICAgICAgICAxODk6ICctJyxcbiAgICAgICAgMTkwOiAnLicsXG4gICAgICAgIDE5MTogJy8nLFxuICAgICAgICAxOTI6ICdgJyxcbiAgICAgICAgMjE5OiAnWycsXG4gICAgICAgIDIyMDogJ1xcXFwnLFxuICAgICAgICAyMjE6ICddJyxcbiAgICAgICAgMjIyOiAnXFwnJ1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiB0aGlzIGlzIGEgbWFwcGluZyBvZiBrZXlzIHRoYXQgcmVxdWlyZSBzaGlmdCBvbiBhIFVTIGtleXBhZFxuICAgICAqIGJhY2sgdG8gdGhlIG5vbiBzaGlmdCBlcXVpdmVsZW50c1xuICAgICAqXG4gICAgICogdGhpcyBpcyBzbyB5b3UgY2FuIHVzZSBrZXl1cCBldmVudHMgd2l0aCB0aGVzZSBrZXlzXG4gICAgICpcbiAgICAgKiBub3RlIHRoYXQgdGhpcyB3aWxsIG9ubHkgd29yayByZWxpYWJseSBvbiBVUyBrZXlib2FyZHNcbiAgICAgKlxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgdmFyIF9TSElGVF9NQVAgPSB7XG4gICAgICAgICd+JzogJ2AnLFxuICAgICAgICAnISc6ICcxJyxcbiAgICAgICAgJ0AnOiAnMicsXG4gICAgICAgICcjJzogJzMnLFxuICAgICAgICAnJCc6ICc0JyxcbiAgICAgICAgJyUnOiAnNScsXG4gICAgICAgICdeJzogJzYnLFxuICAgICAgICAnJic6ICc3JyxcbiAgICAgICAgJyonOiAnOCcsXG4gICAgICAgICcoJzogJzknLFxuICAgICAgICAnKSc6ICcwJyxcbiAgICAgICAgJ18nOiAnLScsXG4gICAgICAgICcrJzogJz0nLFxuICAgICAgICAnOic6ICc7JyxcbiAgICAgICAgJ1xcXCInOiAnXFwnJyxcbiAgICAgICAgJzwnOiAnLCcsXG4gICAgICAgICc+JzogJy4nLFxuICAgICAgICAnPyc6ICcvJyxcbiAgICAgICAgJ3wnOiAnXFxcXCdcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogdGhpcyBpcyBhIGxpc3Qgb2Ygc3BlY2lhbCBzdHJpbmdzIHlvdSBjYW4gdXNlIHRvIG1hcFxuICAgICAqIHRvIG1vZGlmaWVyIGtleXMgd2hlbiB5b3Ugc3BlY2lmeSB5b3VyIGtleWJvYXJkIHNob3J0Y3V0c1xuICAgICAqXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICB2YXIgX1NQRUNJQUxfQUxJQVNFUyA9IHtcbiAgICAgICAgJ29wdGlvbic6ICdhbHQnLFxuICAgICAgICAnY29tbWFuZCc6ICdtZXRhJyxcbiAgICAgICAgJ3JldHVybic6ICdlbnRlcicsXG4gICAgICAgICdlc2NhcGUnOiAnZXNjJyxcbiAgICAgICAgJ3BsdXMnOiAnKycsXG4gICAgICAgICdtb2QnOiAvTWFjfGlQb2R8aVBob25lfGlQYWQvLnRlc3QobmF2aWdhdG9yLnBsYXRmb3JtKSA/ICdtZXRhJyA6ICdjdHJsJ1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiB2YXJpYWJsZSB0byBzdG9yZSB0aGUgZmxpcHBlZCB2ZXJzaW9uIG9mIF9NQVAgZnJvbSBhYm92ZVxuICAgICAqIG5lZWRlZCB0byBjaGVjayBpZiB3ZSBzaG91bGQgdXNlIGtleXByZXNzIG9yIG5vdCB3aGVuIG5vIGFjdGlvblxuICAgICAqIGlzIHNwZWNpZmllZFxuICAgICAqXG4gICAgICogQHR5cGUge09iamVjdHx1bmRlZmluZWR9XG4gICAgICovXG4gICAgdmFyIF9SRVZFUlNFX01BUDtcblxuICAgIC8qKlxuICAgICAqIGxvb3AgdGhyb3VnaCB0aGUgZiBrZXlzLCBmMSB0byBmMTkgYW5kIGFkZCB0aGVtIHRvIHRoZSBtYXBcbiAgICAgKiBwcm9ncmFtYXRpY2FsbHlcbiAgICAgKi9cbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IDIwOyArK2kpIHtcbiAgICAgICAgX01BUFsxMTEgKyBpXSA9ICdmJyArIGk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogbG9vcCB0aHJvdWdoIHRvIG1hcCBudW1iZXJzIG9uIHRoZSBudW1lcmljIGtleXBhZFxuICAgICAqL1xuICAgIGZvciAoaSA9IDA7IGkgPD0gOTsgKytpKSB7XG4gICAgICAgIF9NQVBbaSArIDk2XSA9IGk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogY3Jvc3MgYnJvd3NlciBhZGQgZXZlbnQgbWV0aG9kXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR8SFRNTERvY3VtZW50fSBvYmplY3RcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAgICogQHJldHVybnMgdm9pZFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9hZGRFdmVudChvYmplY3QsIHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChvYmplY3QuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICAgICAgb2JqZWN0LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgY2FsbGJhY2ssIGZhbHNlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG9iamVjdC5hdHRhY2hFdmVudCgnb24nICsgdHlwZSwgY2FsbGJhY2spO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHRha2VzIHRoZSBldmVudCBhbmQgcmV0dXJucyB0aGUga2V5IGNoYXJhY3RlclxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZVxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfY2hhcmFjdGVyRnJvbUV2ZW50KGUpIHtcblxuICAgICAgICAvLyBmb3Iga2V5cHJlc3MgZXZlbnRzIHdlIHNob3VsZCByZXR1cm4gdGhlIGNoYXJhY3RlciBhcyBpc1xuICAgICAgICBpZiAoZS50eXBlID09ICdrZXlwcmVzcycpIHtcbiAgICAgICAgICAgIHZhciBjaGFyYWN0ZXIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGUud2hpY2gpO1xuXG4gICAgICAgICAgICAvLyBpZiB0aGUgc2hpZnQga2V5IGlzIG5vdCBwcmVzc2VkIHRoZW4gaXQgaXMgc2FmZSB0byBhc3N1bWVcbiAgICAgICAgICAgIC8vIHRoYXQgd2Ugd2FudCB0aGUgY2hhcmFjdGVyIHRvIGJlIGxvd2VyY2FzZS4gIHRoaXMgbWVhbnMgaWZcbiAgICAgICAgICAgIC8vIHlvdSBhY2NpZGVudGFsbHkgaGF2ZSBjYXBzIGxvY2sgb24gdGhlbiB5b3VyIGtleSBiaW5kaW5nc1xuICAgICAgICAgICAgLy8gd2lsbCBjb250aW51ZSB0byB3b3JrXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gdGhlIG9ubHkgc2lkZSBlZmZlY3QgdGhhdCBtaWdodCBub3QgYmUgZGVzaXJlZCBpcyBpZiB5b3VcbiAgICAgICAgICAgIC8vIGJpbmQgc29tZXRoaW5nIGxpa2UgJ0EnIGNhdXNlIHlvdSB3YW50IHRvIHRyaWdnZXIgYW5cbiAgICAgICAgICAgIC8vIGV2ZW50IHdoZW4gY2FwaXRhbCBBIGlzIHByZXNzZWQgY2FwcyBsb2NrIHdpbGwgbm8gbG9uZ2VyXG4gICAgICAgICAgICAvLyB0cmlnZ2VyIHRoZSBldmVudC4gIHNoaWZ0K2Egd2lsbCB0aG91Z2guXG4gICAgICAgICAgICBpZiAoIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICBjaGFyYWN0ZXIgPSBjaGFyYWN0ZXIudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNoYXJhY3RlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGZvciBub24ga2V5cHJlc3MgZXZlbnRzIHRoZSBzcGVjaWFsIG1hcHMgYXJlIG5lZWRlZFxuICAgICAgICBpZiAoX01BUFtlLndoaWNoXSkge1xuICAgICAgICAgICAgcmV0dXJuIF9NQVBbZS53aGljaF07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoX0tFWUNPREVfTUFQW2Uud2hpY2hdKSB7XG4gICAgICAgICAgICByZXR1cm4gX0tFWUNPREVfTUFQW2Uud2hpY2hdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgaXQgaXMgbm90IGluIHRoZSBzcGVjaWFsIG1hcFxuXG4gICAgICAgIC8vIHdpdGgga2V5ZG93biBhbmQga2V5dXAgZXZlbnRzIHRoZSBjaGFyYWN0ZXIgc2VlbXMgdG8gYWx3YXlzXG4gICAgICAgIC8vIGNvbWUgaW4gYXMgYW4gdXBwZXJjYXNlIGNoYXJhY3RlciB3aGV0aGVyIHlvdSBhcmUgcHJlc3Npbmcgc2hpZnRcbiAgICAgICAgLy8gb3Igbm90LiAgd2Ugc2hvdWxkIG1ha2Ugc3VyZSBpdCBpcyBhbHdheXMgbG93ZXJjYXNlIGZvciBjb21wYXJpc29uc1xuICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShlLndoaWNoKS50b0xvd2VyQ2FzZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGNoZWNrcyBpZiB0d28gYXJyYXlzIGFyZSBlcXVhbFxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheX0gbW9kaWZpZXJzMVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IG1vZGlmaWVyczJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfbW9kaWZpZXJzTWF0Y2gobW9kaWZpZXJzMSwgbW9kaWZpZXJzMikge1xuICAgICAgICByZXR1cm4gbW9kaWZpZXJzMS5zb3J0KCkuam9pbignLCcpID09PSBtb2RpZmllcnMyLnNvcnQoKS5qb2luKCcsJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogdGFrZXMgYSBrZXkgZXZlbnQgYW5kIGZpZ3VyZXMgb3V0IHdoYXQgdGhlIG1vZGlmaWVycyBhcmVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGVcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9XG4gICAgICovXG4gICAgZnVuY3Rpb24gX2V2ZW50TW9kaWZpZXJzKGUpIHtcbiAgICAgICAgdmFyIG1vZGlmaWVycyA9IFtdO1xuXG4gICAgICAgIGlmIChlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICBtb2RpZmllcnMucHVzaCgnc2hpZnQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlLmFsdEtleSkge1xuICAgICAgICAgICAgbW9kaWZpZXJzLnB1c2goJ2FsdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGUuY3RybEtleSkge1xuICAgICAgICAgICAgbW9kaWZpZXJzLnB1c2goJ2N0cmwnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlLm1ldGFLZXkpIHtcbiAgICAgICAgICAgIG1vZGlmaWVycy5wdXNoKCdtZXRhJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbW9kaWZpZXJzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHByZXZlbnRzIGRlZmF1bHQgZm9yIHRoaXMgZXZlbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGVcbiAgICAgKiBAcmV0dXJucyB2b2lkXG4gICAgICovXG4gICAgZnVuY3Rpb24gX3ByZXZlbnREZWZhdWx0KGUpIHtcbiAgICAgICAgaWYgKGUucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBzdG9wcyBwcm9wb2dhdGlvbiBmb3IgdGhpcyBldmVudFxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZVxuICAgICAqIEByZXR1cm5zIHZvaWRcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfc3RvcFByb3BhZ2F0aW9uKGUpIHtcbiAgICAgICAgaWYgKGUuc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZS5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGRldGVybWluZXMgaWYgdGhlIGtleWNvZGUgc3BlY2lmaWVkIGlzIGEgbW9kaWZpZXIga2V5IG9yIG5vdFxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleVxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9pc01vZGlmaWVyKGtleSkge1xuICAgICAgICByZXR1cm4ga2V5ID09ICdzaGlmdCcgfHwga2V5ID09ICdjdHJsJyB8fCBrZXkgPT0gJ2FsdCcgfHwga2V5ID09ICdtZXRhJztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZXZlcnNlcyB0aGUgbWFwIGxvb2t1cCBzbyB0aGF0IHdlIGNhbiBsb29rIGZvciBzcGVjaWZpYyBrZXlzXG4gICAgICogdG8gc2VlIHdoYXQgY2FuIGFuZCBjYW4ndCB1c2Uga2V5cHJlc3NcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge09iamVjdH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfZ2V0UmV2ZXJzZU1hcCgpIHtcbiAgICAgICAgaWYgKCFfUkVWRVJTRV9NQVApIHtcbiAgICAgICAgICAgIF9SRVZFUlNFX01BUCA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIF9NQVApIHtcblxuICAgICAgICAgICAgICAgIC8vIHB1bGwgb3V0IHRoZSBudW1lcmljIGtleXBhZCBmcm9tIGhlcmUgY2F1c2Uga2V5cHJlc3Mgc2hvdWxkXG4gICAgICAgICAgICAgICAgLy8gYmUgYWJsZSB0byBkZXRlY3QgdGhlIGtleXMgZnJvbSB0aGUgY2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgaWYgKGtleSA+IDk1ICYmIGtleSA8IDExMikge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoX01BUC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIF9SRVZFUlNFX01BUFtfTUFQW2tleV1dID0ga2V5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX1JFVkVSU0VfTUFQO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIHBpY2tzIHRoZSBiZXN0IGFjdGlvbiBiYXNlZCBvbiB0aGUga2V5IGNvbWJpbmF0aW9uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0gY2hhcmFjdGVyIGZvciBrZXlcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBtb2RpZmllcnNcbiAgICAgKiBAcGFyYW0ge3N0cmluZz19IGFjdGlvbiBwYXNzZWQgaW5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfcGlja0Jlc3RBY3Rpb24oa2V5LCBtb2RpZmllcnMsIGFjdGlvbikge1xuXG4gICAgICAgIC8vIGlmIG5vIGFjdGlvbiB3YXMgcGlja2VkIGluIHdlIHNob3VsZCB0cnkgdG8gcGljayB0aGUgb25lXG4gICAgICAgIC8vIHRoYXQgd2UgdGhpbmsgd291bGQgd29yayBiZXN0IGZvciB0aGlzIGtleVxuICAgICAgICBpZiAoIWFjdGlvbikge1xuICAgICAgICAgICAgYWN0aW9uID0gX2dldFJldmVyc2VNYXAoKVtrZXldID8gJ2tleWRvd24nIDogJ2tleXByZXNzJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG1vZGlmaWVyIGtleXMgZG9uJ3Qgd29yayBhcyBleHBlY3RlZCB3aXRoIGtleXByZXNzLFxuICAgICAgICAvLyBzd2l0Y2ggdG8ga2V5ZG93blxuICAgICAgICBpZiAoYWN0aW9uID09ICdrZXlwcmVzcycgJiYgbW9kaWZpZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgYWN0aW9uID0gJ2tleWRvd24nO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFjdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyBmcm9tIGEgc3RyaW5nIGtleSBjb21iaW5hdGlvbiB0byBhbiBhcnJheVxuICAgICAqXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSBjb21iaW5hdGlvbiBsaWtlIFwiY29tbWFuZCtzaGlmdCtsXCJcbiAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfa2V5c0Zyb21TdHJpbmcoY29tYmluYXRpb24pIHtcbiAgICAgICAgaWYgKGNvbWJpbmF0aW9uID09PSAnKycpIHtcbiAgICAgICAgICAgIHJldHVybiBbJysnXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbWJpbmF0aW9uID0gY29tYmluYXRpb24ucmVwbGFjZSgvXFwrezJ9L2csICcrcGx1cycpO1xuICAgICAgICByZXR1cm4gY29tYmluYXRpb24uc3BsaXQoJysnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIGluZm8gZm9yIGEgc3BlY2lmaWMga2V5IGNvbWJpbmF0aW9uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IGNvbWJpbmF0aW9uIGtleSBjb21iaW5hdGlvbiAoXCJjb21tYW5kK3NcIiBvciBcImFcIiBvciBcIipcIilcbiAgICAgKiBAcGFyYW0gIHtzdHJpbmc9fSBhY3Rpb25cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9nZXRLZXlJbmZvKGNvbWJpbmF0aW9uLCBhY3Rpb24pIHtcbiAgICAgICAgdmFyIGtleXM7XG4gICAgICAgIHZhciBrZXk7XG4gICAgICAgIHZhciBpO1xuICAgICAgICB2YXIgbW9kaWZpZXJzID0gW107XG5cbiAgICAgICAgLy8gdGFrZSB0aGUga2V5cyBmcm9tIHRoaXMgcGF0dGVybiBhbmQgZmlndXJlIG91dCB3aGF0IHRoZSBhY3R1YWxcbiAgICAgICAgLy8gcGF0dGVybiBpcyBhbGwgYWJvdXRcbiAgICAgICAga2V5cyA9IF9rZXlzRnJvbVN0cmluZyhjb21iaW5hdGlvbik7XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGtleSA9IGtleXNbaV07XG5cbiAgICAgICAgICAgIC8vIG5vcm1hbGl6ZSBrZXkgbmFtZXNcbiAgICAgICAgICAgIGlmIChfU1BFQ0lBTF9BTElBU0VTW2tleV0pIHtcbiAgICAgICAgICAgICAgICBrZXkgPSBfU1BFQ0lBTF9BTElBU0VTW2tleV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoaXMgaXMgbm90IGEga2V5cHJlc3MgZXZlbnQgdGhlbiB3ZSBzaG91bGRcbiAgICAgICAgICAgIC8vIGJlIHNtYXJ0IGFib3V0IHVzaW5nIHNoaWZ0IGtleXNcbiAgICAgICAgICAgIC8vIHRoaXMgd2lsbCBvbmx5IHdvcmsgZm9yIFVTIGtleWJvYXJkcyBob3dldmVyXG4gICAgICAgICAgICBpZiAoYWN0aW9uICYmIGFjdGlvbiAhPSAna2V5cHJlc3MnICYmIF9TSElGVF9NQVBba2V5XSkge1xuICAgICAgICAgICAgICAgIGtleSA9IF9TSElGVF9NQVBba2V5XTtcbiAgICAgICAgICAgICAgICBtb2RpZmllcnMucHVzaCgnc2hpZnQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgdGhpcyBrZXkgaXMgYSBtb2RpZmllciB0aGVuIGFkZCBpdCB0byB0aGUgbGlzdCBvZiBtb2RpZmllcnNcbiAgICAgICAgICAgIGlmIChfaXNNb2RpZmllcihrZXkpKSB7XG4gICAgICAgICAgICAgICAgbW9kaWZpZXJzLnB1c2goa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRlcGVuZGluZyBvbiB3aGF0IHRoZSBrZXkgY29tYmluYXRpb24gaXNcbiAgICAgICAgLy8gd2Ugd2lsbCB0cnkgdG8gcGljayB0aGUgYmVzdCBldmVudCBmb3IgaXRcbiAgICAgICAgYWN0aW9uID0gX3BpY2tCZXN0QWN0aW9uKGtleSwgbW9kaWZpZXJzLCBhY3Rpb24pO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgIG1vZGlmaWVyczogbW9kaWZpZXJzLFxuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfYmVsb25nc1RvKGVsZW1lbnQsIGFuY2VzdG9yKSB7XG4gICAgICAgIGlmIChlbGVtZW50ID09PSBudWxsIHx8IGVsZW1lbnQgPT09IGRvY3VtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWxlbWVudCA9PT0gYW5jZXN0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIF9iZWxvbmdzVG8oZWxlbWVudC5wYXJlbnROb2RlLCBhbmNlc3Rvcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gTW91c2V0cmFwKHRhcmdldEVsZW1lbnQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHRhcmdldEVsZW1lbnQgPSB0YXJnZXRFbGVtZW50IHx8IGRvY3VtZW50O1xuXG4gICAgICAgIGlmICghKHNlbGYgaW5zdGFuY2VvZiBNb3VzZXRyYXApKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE1vdXNldHJhcCh0YXJnZXRFbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBlbGVtZW50IHRvIGF0dGFjaCBrZXkgZXZlbnRzIHRvXG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIHtFbGVtZW50fVxuICAgICAgICAgKi9cbiAgICAgICAgc2VsZi50YXJnZXQgPSB0YXJnZXRFbGVtZW50O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBhIGxpc3Qgb2YgYWxsIHRoZSBjYWxsYmFja3Mgc2V0dXAgdmlhIE1vdXNldHJhcC5iaW5kKClcbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHNlbGYuX2NhbGxiYWNrcyA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBkaXJlY3QgbWFwIG9mIHN0cmluZyBjb21iaW5hdGlvbnMgdG8gY2FsbGJhY2tzIHVzZWQgZm9yIHRyaWdnZXIoKVxuICAgICAgICAgKlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgc2VsZi5fZGlyZWN0TWFwID0ge307XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGtlZXBzIHRyYWNrIG9mIHdoYXQgbGV2ZWwgZWFjaCBzZXF1ZW5jZSBpcyBhdCBzaW5jZSBtdWx0aXBsZVxuICAgICAgICAgKiBzZXF1ZW5jZXMgY2FuIHN0YXJ0IG91dCB3aXRoIHRoZSBzYW1lIHNlcXVlbmNlXG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB2YXIgX3NlcXVlbmNlTGV2ZWxzID0ge307XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIHZhcmlhYmxlIHRvIHN0b3JlIHRoZSBzZXRUaW1lb3V0IGNhbGxcbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge251bGx8bnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9yZXNldFRpbWVyO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiB0ZW1wb3Jhcnkgc3RhdGUgd2hlcmUgd2Ugd2lsbCBpZ25vcmUgdGhlIG5leHQga2V5dXBcbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW58c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9pZ25vcmVOZXh0S2V5dXAgPSBmYWxzZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogdGVtcG9yYXJ5IHN0YXRlIHdoZXJlIHdlIHdpbGwgaWdub3JlIHRoZSBuZXh0IGtleXByZXNzXG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIF9pZ25vcmVOZXh0S2V5cHJlc3MgPSBmYWxzZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogYXJlIHdlIGN1cnJlbnRseSBpbnNpZGUgb2YgYSBzZXF1ZW5jZT9cbiAgICAgICAgICogdHlwZSBvZiBhY3Rpb24gKFwia2V5dXBcIiBvciBcImtleWRvd25cIiBvciBcImtleXByZXNzXCIpIG9yIGZhbHNlXG4gICAgICAgICAqXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufHN0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHZhciBfbmV4dEV4cGVjdGVkQWN0aW9uID0gZmFsc2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIHJlc2V0cyBhbGwgc2VxdWVuY2UgY291bnRlcnMgZXhjZXB0IGZvciB0aGUgb25lcyBwYXNzZWQgaW5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGRvTm90UmVzZXRcbiAgICAgICAgICogQHJldHVybnMgdm9pZFxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gX3Jlc2V0U2VxdWVuY2VzKGRvTm90UmVzZXQpIHtcbiAgICAgICAgICAgIGRvTm90UmVzZXQgPSBkb05vdFJlc2V0IHx8IHt9O1xuXG4gICAgICAgICAgICB2YXIgYWN0aXZlU2VxdWVuY2VzID0gZmFsc2UsXG4gICAgICAgICAgICAgICAga2V5O1xuXG4gICAgICAgICAgICBmb3IgKGtleSBpbiBfc2VxdWVuY2VMZXZlbHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9Ob3RSZXNldFtrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZVNlcXVlbmNlcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfc2VxdWVuY2VMZXZlbHNba2V5XSA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghYWN0aXZlU2VxdWVuY2VzKSB7XG4gICAgICAgICAgICAgICAgX25leHRFeHBlY3RlZEFjdGlvbiA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGZpbmRzIGFsbCBjYWxsYmFja3MgdGhhdCBtYXRjaCBiYXNlZCBvbiB0aGUga2V5Y29kZSwgbW9kaWZpZXJzLFxuICAgICAgICAgKiBhbmQgYWN0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjaGFyYWN0ZXJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gbW9kaWZpZXJzXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnR8T2JqZWN0fSBlXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nPX0gc2VxdWVuY2VOYW1lIC0gbmFtZSBvZiB0aGUgc2VxdWVuY2Ugd2UgYXJlIGxvb2tpbmcgZm9yXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nPX0gY29tYmluYXRpb25cbiAgICAgICAgICogQHBhcmFtIHtudW1iZXI9fSBsZXZlbFxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXl9XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBfZ2V0TWF0Y2hlcyhjaGFyYWN0ZXIsIG1vZGlmaWVycywgZSwgc2VxdWVuY2VOYW1lLCBjb21iaW5hdGlvbiwgbGV2ZWwpIHtcbiAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrO1xuICAgICAgICAgICAgdmFyIG1hdGNoZXMgPSBbXTtcbiAgICAgICAgICAgIHZhciBhY3Rpb24gPSBlLnR5cGU7XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZXJlIGFyZSBubyBldmVudHMgcmVsYXRlZCB0byB0aGlzIGtleWNvZGVcbiAgICAgICAgICAgIGlmICghc2VsZi5fY2FsbGJhY2tzW2NoYXJhY3Rlcl0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIGEgbW9kaWZpZXIga2V5IGlzIGNvbWluZyB1cCBvbiBpdHMgb3duIHdlIHNob3VsZCBhbGxvdyBpdFxuICAgICAgICAgICAgaWYgKGFjdGlvbiA9PSAna2V5dXAnICYmIF9pc01vZGlmaWVyKGNoYXJhY3RlcikpIHtcbiAgICAgICAgICAgICAgICBtb2RpZmllcnMgPSBbY2hhcmFjdGVyXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gbG9vcCB0aHJvdWdoIGFsbCBjYWxsYmFja3MgZm9yIHRoZSBrZXkgdGhhdCB3YXMgcHJlc3NlZFxuICAgICAgICAgICAgLy8gYW5kIHNlZSBpZiBhbnkgb2YgdGhlbSBtYXRjaFxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHNlbGYuX2NhbGxiYWNrc1tjaGFyYWN0ZXJdLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBzZWxmLl9jYWxsYmFja3NbY2hhcmFjdGVyXVtpXTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGEgc2VxdWVuY2UgbmFtZSBpcyBub3Qgc3BlY2lmaWVkLCBidXQgdGhpcyBpcyBhIHNlcXVlbmNlIGF0XG4gICAgICAgICAgICAgICAgLy8gdGhlIHdyb25nIGxldmVsIHRoZW4gbW92ZSBvbnRvIHRoZSBuZXh0IG1hdGNoXG4gICAgICAgICAgICAgICAgaWYgKCFzZXF1ZW5jZU5hbWUgJiYgY2FsbGJhY2suc2VxICYmIF9zZXF1ZW5jZUxldmVsc1tjYWxsYmFjay5zZXFdICE9IGNhbGxiYWNrLmxldmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBhY3Rpb24gd2UgYXJlIGxvb2tpbmcgZm9yIGRvZXNuJ3QgbWF0Y2ggdGhlIGFjdGlvbiB3ZSBnb3RcbiAgICAgICAgICAgICAgICAvLyB0aGVuIHdlIHNob3VsZCBrZWVwIGdvaW5nXG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbiAhPSBjYWxsYmFjay5hY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyBhIGtleXByZXNzIGV2ZW50IGFuZCB0aGUgbWV0YSBrZXkgYW5kIGNvbnRyb2wga2V5XG4gICAgICAgICAgICAgICAgLy8gYXJlIG5vdCBwcmVzc2VkIHRoYXQgbWVhbnMgdGhhdCB3ZSBuZWVkIHRvIG9ubHkgbG9vayBhdCB0aGVcbiAgICAgICAgICAgICAgICAvLyBjaGFyYWN0ZXIsIG90aGVyd2lzZSBjaGVjayB0aGUgbW9kaWZpZXJzIGFzIHdlbGxcbiAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgIC8vIGNocm9tZSB3aWxsIG5vdCBmaXJlIGEga2V5cHJlc3MgaWYgbWV0YSBvciBjb250cm9sIGlzIGRvd25cbiAgICAgICAgICAgICAgICAvLyBzYWZhcmkgd2lsbCBmaXJlIGEga2V5cHJlc3MgaWYgbWV0YSBvciBtZXRhK3NoaWZ0IGlzIGRvd25cbiAgICAgICAgICAgICAgICAvLyBmaXJlZm94IHdpbGwgZmlyZSBhIGtleXByZXNzIGlmIG1ldGEgb3IgY29udHJvbCBpcyBkb3duXG4gICAgICAgICAgICAgICAgaWYgKChhY3Rpb24gPT0gJ2tleXByZXNzJyAmJiAhZS5tZXRhS2V5ICYmICFlLmN0cmxLZXkpIHx8IF9tb2RpZmllcnNNYXRjaChtb2RpZmllcnMsIGNhbGxiYWNrLm1vZGlmaWVycykpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyB3aGVuIHlvdSBiaW5kIGEgY29tYmluYXRpb24gb3Igc2VxdWVuY2UgYSBzZWNvbmQgdGltZSBpdFxuICAgICAgICAgICAgICAgICAgICAvLyBzaG91bGQgb3ZlcndyaXRlIHRoZSBmaXJzdCBvbmUuICBpZiBhIHNlcXVlbmNlTmFtZSBvclxuICAgICAgICAgICAgICAgICAgICAvLyBjb21iaW5hdGlvbiBpcyBzcGVjaWZpZWQgaW4gdGhpcyBjYWxsIGl0IGRvZXMganVzdCB0aGF0XG4gICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgIC8vIEB0b2RvIG1ha2UgZGVsZXRpbmcgaXRzIG93biBtZXRob2Q/XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZWxldGVDb21ibyA9ICFzZXF1ZW5jZU5hbWUgJiYgY2FsbGJhY2suY29tYm8gPT0gY29tYmluYXRpb247XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZWxldGVTZXF1ZW5jZSA9IHNlcXVlbmNlTmFtZSAmJiBjYWxsYmFjay5zZXEgPT0gc2VxdWVuY2VOYW1lICYmIGNhbGxiYWNrLmxldmVsID09IGxldmVsO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGVsZXRlQ29tYm8gfHwgZGVsZXRlU2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX2NhbGxiYWNrc1tjaGFyYWN0ZXJdLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZXMucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBhY3R1YWxseSBjYWxscyB0aGUgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgICAgICpcbiAgICAgICAgICogaWYgeW91ciBjYWxsYmFjayBmdW5jdGlvbiByZXR1cm5zIGZhbHNlIHRoaXMgd2lsbCB1c2UgdGhlIGpxdWVyeVxuICAgICAgICAgKiBjb252ZW50aW9uIC0gcHJldmVudCBkZWZhdWx0IGFuZCBzdG9wIHByb3BvZ2F0aW9uIG9uIHRoZSBldmVudFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50fSBlXG4gICAgICAgICAqIEByZXR1cm5zIHZvaWRcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9maXJlQ2FsbGJhY2soY2FsbGJhY2ssIGUsIGNvbWJvLCBzZXF1ZW5jZSkge1xuXG4gICAgICAgICAgICAvLyBpZiB0aGlzIGV2ZW50IHNob3VsZCBub3QgaGFwcGVuIHN0b3AgaGVyZVxuICAgICAgICAgICAgaWYgKHNlbGYuc3RvcENhbGxiYWNrKGUsIGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudCwgY29tYm8sIHNlcXVlbmNlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKGUsIGNvbWJvKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBfcHJldmVudERlZmF1bHQoZSk7XG4gICAgICAgICAgICAgICAgX3N0b3BQcm9wYWdhdGlvbihlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBoYW5kbGVzIGEgY2hhcmFjdGVyIGtleSBldmVudFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2hhcmFjdGVyXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IG1vZGlmaWVyc1xuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50fSBlXG4gICAgICAgICAqIEByZXR1cm5zIHZvaWRcbiAgICAgICAgICovXG4gICAgICAgIHNlbGYuX2hhbmRsZUtleSA9IGZ1bmN0aW9uKGNoYXJhY3RlciwgbW9kaWZpZXJzLCBlKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tzID0gX2dldE1hdGNoZXMoY2hhcmFjdGVyLCBtb2RpZmllcnMsIGUpO1xuICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICB2YXIgZG9Ob3RSZXNldCA9IHt9O1xuICAgICAgICAgICAgdmFyIG1heExldmVsID0gMDtcbiAgICAgICAgICAgIHZhciBwcm9jZXNzZWRTZXF1ZW5jZUNhbGxiYWNrID0gZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgbWF4TGV2ZWwgZm9yIHNlcXVlbmNlcyBzbyB3ZSBjYW4gb25seSBleGVjdXRlIHRoZSBsb25nZXN0IGNhbGxiYWNrIHNlcXVlbmNlXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrc1tpXS5zZXEpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF4TGV2ZWwgPSBNYXRoLm1heChtYXhMZXZlbCwgY2FsbGJhY2tzW2ldLmxldmVsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGxvb3AgdGhyb3VnaCBtYXRjaGluZyBjYWxsYmFja3MgZm9yIHRoaXMga2V5IGV2ZW50XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgKytpKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBmaXJlIGZvciBhbGwgc2VxdWVuY2UgY2FsbGJhY2tzXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpcyBiZWNhdXNlIGlmIGZvciBleGFtcGxlIHlvdSBoYXZlIG11bHRpcGxlIHNlcXVlbmNlc1xuICAgICAgICAgICAgICAgIC8vIGJvdW5kIHN1Y2ggYXMgXCJnIGlcIiBhbmQgXCJnIHRcIiB0aGV5IGJvdGggbmVlZCB0byBmaXJlIHRoZVxuICAgICAgICAgICAgICAgIC8vIGNhbGxiYWNrIGZvciBtYXRjaGluZyBnIGNhdXNlIG90aGVyd2lzZSB5b3UgY2FuIG9ubHkgZXZlclxuICAgICAgICAgICAgICAgIC8vIG1hdGNoIHRoZSBmaXJzdCBvbmVcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2tzW2ldLnNlcSkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIG9ubHkgZmlyZSBjYWxsYmFja3MgZm9yIHRoZSBtYXhMZXZlbCB0byBwcmV2ZW50XG4gICAgICAgICAgICAgICAgICAgIC8vIHN1YnNlcXVlbmNlcyBmcm9tIGFsc28gZmlyaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgIC8vIGZvciBleGFtcGxlICdhIG9wdGlvbiBiJyBzaG91bGQgbm90IGNhdXNlICdvcHRpb24gYicgdG8gZmlyZVxuICAgICAgICAgICAgICAgICAgICAvLyBldmVuIHRob3VnaCAnb3B0aW9uIGInIGlzIHBhcnQgb2YgdGhlIG90aGVyIHNlcXVlbmNlXG4gICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgIC8vIGFueSBzZXF1ZW5jZXMgdGhhdCBkbyBub3QgbWF0Y2ggaGVyZSB3aWxsIGJlIGRpc2NhcmRlZFxuICAgICAgICAgICAgICAgICAgICAvLyBiZWxvdyBieSB0aGUgX3Jlc2V0U2VxdWVuY2VzIGNhbGxcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrc1tpXS5sZXZlbCAhPSBtYXhMZXZlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzZWRTZXF1ZW5jZUNhbGxiYWNrID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBrZWVwIGEgbGlzdCBvZiB3aGljaCBzZXF1ZW5jZXMgd2VyZSBtYXRjaGVzIGZvciBsYXRlclxuICAgICAgICAgICAgICAgICAgICBkb05vdFJlc2V0W2NhbGxiYWNrc1tpXS5zZXFdID0gMTtcbiAgICAgICAgICAgICAgICAgICAgX2ZpcmVDYWxsYmFjayhjYWxsYmFja3NbaV0uY2FsbGJhY2ssIGUsIGNhbGxiYWNrc1tpXS5jb21ibywgY2FsbGJhY2tzW2ldLnNlcSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlIHdlcmUgbm8gc2VxdWVuY2UgbWF0Y2hlcyBidXQgd2UgYXJlIHN0aWxsIGhlcmVcbiAgICAgICAgICAgICAgICAvLyB0aGF0IG1lYW5zIHRoaXMgaXMgYSByZWd1bGFyIG1hdGNoIHNvIHdlIHNob3VsZCBmaXJlIHRoYXRcbiAgICAgICAgICAgICAgICBpZiAoIXByb2Nlc3NlZFNlcXVlbmNlQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgX2ZpcmVDYWxsYmFjayhjYWxsYmFja3NbaV0uY2FsbGJhY2ssIGUsIGNhbGxiYWNrc1tpXS5jb21ibyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiB0aGUga2V5IHlvdSBwcmVzc2VkIG1hdGNoZXMgdGhlIHR5cGUgb2Ygc2VxdWVuY2Ugd2l0aG91dFxuICAgICAgICAgICAgLy8gYmVpbmcgYSBtb2RpZmllciAoaWUgXCJrZXl1cFwiIG9yIFwia2V5cHJlc3NcIikgdGhlbiB3ZSBzaG91bGRcbiAgICAgICAgICAgIC8vIHJlc2V0IGFsbCBzZXF1ZW5jZXMgdGhhdCB3ZXJlIG5vdCBtYXRjaGVkIGJ5IHRoaXMgZXZlbnRcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyB0aGlzIGlzIHNvLCBmb3IgZXhhbXBsZSwgaWYgeW91IGhhdmUgdGhlIHNlcXVlbmNlIFwiaCBhIHRcIiBhbmQgeW91XG4gICAgICAgICAgICAvLyB0eXBlIFwiaCBlIGEgciB0XCIgaXQgZG9lcyBub3QgbWF0Y2guICBpbiB0aGlzIGNhc2UgdGhlIFwiZVwiIHdpbGxcbiAgICAgICAgICAgIC8vIGNhdXNlIHRoZSBzZXF1ZW5jZSB0byByZXNldFxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIG1vZGlmaWVyIGtleXMgYXJlIGlnbm9yZWQgYmVjYXVzZSB5b3UgY2FuIGhhdmUgYSBzZXF1ZW5jZVxuICAgICAgICAgICAgLy8gdGhhdCBjb250YWlucyBtb2RpZmllcnMgc3VjaCBhcyBcImVudGVyIGN0cmwrc3BhY2VcIiBhbmQgaW4gbW9zdFxuICAgICAgICAgICAgLy8gY2FzZXMgdGhlIG1vZGlmaWVyIGtleSB3aWxsIGJlIHByZXNzZWQgYmVmb3JlIHRoZSBuZXh0IGtleVxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIGFsc28gaWYgeW91IGhhdmUgYSBzZXF1ZW5jZSBzdWNoIGFzIFwiY3RybCtiIGFcIiB0aGVuIHByZXNzaW5nIHRoZVxuICAgICAgICAgICAgLy8gXCJiXCIga2V5IHdpbGwgdHJpZ2dlciBhIFwia2V5cHJlc3NcIiBhbmQgYSBcImtleWRvd25cIlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIHRoZSBcImtleWRvd25cIiBpcyBleHBlY3RlZCB3aGVuIHRoZXJlIGlzIGEgbW9kaWZpZXIsIGJ1dCB0aGVcbiAgICAgICAgICAgIC8vIFwia2V5cHJlc3NcIiBlbmRzIHVwIG1hdGNoaW5nIHRoZSBfbmV4dEV4cGVjdGVkQWN0aW9uIHNpbmNlIGl0IG9jY3Vyc1xuICAgICAgICAgICAgLy8gYWZ0ZXIgYW5kIHRoYXQgY2F1c2VzIHRoZSBzZXF1ZW5jZSB0byByZXNldFxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIHdlIGlnbm9yZSBrZXlwcmVzc2VzIGluIGEgc2VxdWVuY2UgdGhhdCBkaXJlY3RseSBmb2xsb3cgYSBrZXlkb3duXG4gICAgICAgICAgICAvLyBmb3IgdGhlIHNhbWUgY2hhcmFjdGVyXG4gICAgICAgICAgICB2YXIgaWdub3JlVGhpc0tleXByZXNzID0gZS50eXBlID09ICdrZXlwcmVzcycgJiYgX2lnbm9yZU5leHRLZXlwcmVzcztcbiAgICAgICAgICAgIGlmIChlLnR5cGUgPT0gX25leHRFeHBlY3RlZEFjdGlvbiAmJiAhX2lzTW9kaWZpZXIoY2hhcmFjdGVyKSAmJiAhaWdub3JlVGhpc0tleXByZXNzKSB7XG4gICAgICAgICAgICAgICAgX3Jlc2V0U2VxdWVuY2VzKGRvTm90UmVzZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBfaWdub3JlTmV4dEtleXByZXNzID0gcHJvY2Vzc2VkU2VxdWVuY2VDYWxsYmFjayAmJiBlLnR5cGUgPT0gJ2tleWRvd24nO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBoYW5kbGVzIGEga2V5ZG93biBldmVudFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50fSBlXG4gICAgICAgICAqIEByZXR1cm5zIHZvaWRcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9oYW5kbGVLZXlFdmVudChlKSB7XG5cbiAgICAgICAgICAgIC8vIG5vcm1hbGl6ZSBlLndoaWNoIGZvciBrZXkgZXZlbnRzXG4gICAgICAgICAgICAvLyBAc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNDI4NTYyNy9qYXZhc2NyaXB0LWtleWNvZGUtdnMtY2hhcmNvZGUtdXR0ZXItY29uZnVzaW9uXG4gICAgICAgICAgICBpZiAodHlwZW9mIGUud2hpY2ggIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICAgICAgZS53aGljaCA9IGUua2V5Q29kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGNoYXJhY3RlciA9IF9jaGFyYWN0ZXJGcm9tRXZlbnQoZSk7XG5cbiAgICAgICAgICAgIC8vIG5vIGNoYXJhY3RlciBmb3VuZCB0aGVuIHN0b3BcbiAgICAgICAgICAgIGlmICghY2hhcmFjdGVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBuZWVkIHRvIHVzZSA9PT0gZm9yIHRoZSBjaGFyYWN0ZXIgY2hlY2sgYmVjYXVzZSB0aGUgY2hhcmFjdGVyIGNhbiBiZSAwXG4gICAgICAgICAgICBpZiAoZS50eXBlID09ICdrZXl1cCcgJiYgX2lnbm9yZU5leHRLZXl1cCA9PT0gY2hhcmFjdGVyKSB7XG4gICAgICAgICAgICAgICAgX2lnbm9yZU5leHRLZXl1cCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZi5oYW5kbGVLZXkoY2hhcmFjdGVyLCBfZXZlbnRNb2RpZmllcnMoZSksIGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIGNhbGxlZCB0byBzZXQgYSAxIHNlY29uZCB0aW1lb3V0IG9uIHRoZSBzcGVjaWZpZWQgc2VxdWVuY2VcbiAgICAgICAgICpcbiAgICAgICAgICogdGhpcyBpcyBzbyBhZnRlciBlYWNoIGtleSBwcmVzcyBpbiB0aGUgc2VxdWVuY2UgeW91IGhhdmUgMSBzZWNvbmRcbiAgICAgICAgICogdG8gcHJlc3MgdGhlIG5leHQga2V5IGJlZm9yZSB5b3UgaGF2ZSB0byBzdGFydCBvdmVyXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHZvaWRcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9yZXNldFNlcXVlbmNlVGltZXIoKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoX3Jlc2V0VGltZXIpO1xuICAgICAgICAgICAgX3Jlc2V0VGltZXIgPSBzZXRUaW1lb3V0KF9yZXNldFNlcXVlbmNlcywgMTAwMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogYmluZHMgYSBrZXkgc2VxdWVuY2UgdG8gYW4gZXZlbnRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbWJvIC0gY29tYm8gc3BlY2lmaWVkIGluIGJpbmQgY2FsbFxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBrZXlzXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nPX0gYWN0aW9uXG4gICAgICAgICAqIEByZXR1cm5zIHZvaWRcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9iaW5kU2VxdWVuY2UoY29tYm8sIGtleXMsIGNhbGxiYWNrLCBhY3Rpb24pIHtcblxuICAgICAgICAgICAgLy8gc3RhcnQgb2ZmIGJ5IGFkZGluZyBhIHNlcXVlbmNlIGxldmVsIHJlY29yZCBmb3IgdGhpcyBjb21iaW5hdGlvblxuICAgICAgICAgICAgLy8gYW5kIHNldHRpbmcgdGhlIGxldmVsIHRvIDBcbiAgICAgICAgICAgIF9zZXF1ZW5jZUxldmVsc1tjb21ib10gPSAwO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIGNhbGxiYWNrIHRvIGluY3JlYXNlIHRoZSBzZXF1ZW5jZSBsZXZlbCBmb3IgdGhpcyBzZXF1ZW5jZSBhbmQgcmVzZXRcbiAgICAgICAgICAgICAqIGFsbCBvdGhlciBzZXF1ZW5jZXMgdGhhdCB3ZXJlIGFjdGl2ZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXh0QWN0aW9uXG4gICAgICAgICAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIF9pbmNyZWFzZVNlcXVlbmNlKG5leHRBY3Rpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIF9uZXh0RXhwZWN0ZWRBY3Rpb24gPSBuZXh0QWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICArK19zZXF1ZW5jZUxldmVsc1tjb21ib107XG4gICAgICAgICAgICAgICAgICAgIF9yZXNldFNlcXVlbmNlVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIHdyYXBzIHRoZSBzcGVjaWZpZWQgY2FsbGJhY2sgaW5zaWRlIG9mIGFub3RoZXIgZnVuY3Rpb24gaW4gb3JkZXJcbiAgICAgICAgICAgICAqIHRvIHJlc2V0IGFsbCBzZXF1ZW5jZSBjb3VudGVycyBhcyBzb29uIGFzIHRoaXMgc2VxdWVuY2UgaXMgZG9uZVxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7RXZlbnR9IGVcbiAgICAgICAgICAgICAqIEByZXR1cm5zIHZvaWRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZnVuY3Rpb24gX2NhbGxiYWNrQW5kUmVzZXQoZSkge1xuICAgICAgICAgICAgICAgIF9maXJlQ2FsbGJhY2soY2FsbGJhY2ssIGUsIGNvbWJvKTtcblxuICAgICAgICAgICAgICAgIC8vIHdlIHNob3VsZCBpZ25vcmUgdGhlIG5leHQga2V5IHVwIGlmIHRoZSBhY3Rpb24gaXMga2V5IGRvd25cbiAgICAgICAgICAgICAgICAvLyBvciBrZXlwcmVzcy4gIHRoaXMgaXMgc28gaWYgeW91IGZpbmlzaCBhIHNlcXVlbmNlIGFuZFxuICAgICAgICAgICAgICAgIC8vIHJlbGVhc2UgdGhlIGtleSB0aGUgZmluYWwga2V5IHdpbGwgbm90IHRyaWdnZXIgYSBrZXl1cFxuICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gIT09ICdrZXl1cCcpIHtcbiAgICAgICAgICAgICAgICAgICAgX2lnbm9yZU5leHRLZXl1cCA9IF9jaGFyYWN0ZXJGcm9tRXZlbnQoZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gd2VpcmQgcmFjZSBjb25kaXRpb24gaWYgYSBzZXF1ZW5jZSBlbmRzIHdpdGggdGhlIGtleVxuICAgICAgICAgICAgICAgIC8vIGFub3RoZXIgc2VxdWVuY2UgYmVnaW5zIHdpdGhcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KF9yZXNldFNlcXVlbmNlcywgMTApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBsb29wIHRocm91Z2gga2V5cyBvbmUgYXQgYSB0aW1lIGFuZCBiaW5kIHRoZSBhcHByb3ByaWF0ZSBjYWxsYmFja1xuICAgICAgICAgICAgLy8gZnVuY3Rpb24uICBmb3IgYW55IGtleSBsZWFkaW5nIHVwIHRvIHRoZSBmaW5hbCBvbmUgaXQgc2hvdWxkXG4gICAgICAgICAgICAvLyBpbmNyZWFzZSB0aGUgc2VxdWVuY2UuIGFmdGVyIHRoZSBmaW5hbCwgaXQgc2hvdWxkIHJlc2V0IGFsbCBzZXF1ZW5jZXNcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBpZiBhbiBhY3Rpb24gaXMgc3BlY2lmaWVkIGluIHRoZSBvcmlnaW5hbCBiaW5kIGNhbGwgdGhlbiB0aGF0IHdpbGxcbiAgICAgICAgICAgIC8vIGJlIHVzZWQgdGhyb3VnaG91dC4gIG90aGVyd2lzZSB3ZSB3aWxsIHBhc3MgdGhlIGFjdGlvbiB0aGF0IHRoZVxuICAgICAgICAgICAgLy8gbmV4dCBrZXkgaW4gdGhlIHNlcXVlbmNlIHNob3VsZCBtYXRjaC4gIHRoaXMgYWxsb3dzIGEgc2VxdWVuY2VcbiAgICAgICAgICAgIC8vIHRvIG1peCBhbmQgbWF0Y2gga2V5cHJlc3MgYW5kIGtleWRvd24gZXZlbnRzIGRlcGVuZGluZyBvbiB3aGljaFxuICAgICAgICAgICAgLy8gb25lcyBhcmUgYmV0dGVyIHN1aXRlZCB0byB0aGUga2V5IHByb3ZpZGVkXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2YXIgaXNGaW5hbCA9IGkgKyAxID09PSBrZXlzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB2YXIgd3JhcHBlZENhbGxiYWNrID0gaXNGaW5hbCA/IF9jYWxsYmFja0FuZFJlc2V0IDogX2luY3JlYXNlU2VxdWVuY2UoYWN0aW9uIHx8IF9nZXRLZXlJbmZvKGtleXNbaSArIDFdKS5hY3Rpb24pO1xuICAgICAgICAgICAgICAgIF9iaW5kU2luZ2xlKGtleXNbaV0sIHdyYXBwZWRDYWxsYmFjaywgYWN0aW9uLCBjb21ibywgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogYmluZHMgYSBzaW5nbGUga2V5Ym9hcmQgY29tYmluYXRpb25cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbWJpbmF0aW9uXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nPX0gYWN0aW9uXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nPX0gc2VxdWVuY2VOYW1lIC0gbmFtZSBvZiBzZXF1ZW5jZSBpZiBwYXJ0IG9mIHNlcXVlbmNlXG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyPX0gbGV2ZWwgLSB3aGF0IHBhcnQgb2YgdGhlIHNlcXVlbmNlIHRoZSBjb21tYW5kIGlzXG4gICAgICAgICAqIEByZXR1cm5zIHZvaWRcbiAgICAgICAgICovXG4gICAgICAgIGZ1bmN0aW9uIF9iaW5kU2luZ2xlKGNvbWJpbmF0aW9uLCBjYWxsYmFjaywgYWN0aW9uLCBzZXF1ZW5jZU5hbWUsIGxldmVsKSB7XG5cbiAgICAgICAgICAgIC8vIHN0b3JlIGEgZGlyZWN0IG1hcHBlZCByZWZlcmVuY2UgZm9yIHVzZSB3aXRoIE1vdXNldHJhcC50cmlnZ2VyXG4gICAgICAgICAgICBzZWxmLl9kaXJlY3RNYXBbY29tYmluYXRpb24gKyAnOicgKyBhY3Rpb25dID0gY2FsbGJhY2s7XG5cbiAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSBtdWx0aXBsZSBzcGFjZXMgaW4gYSByb3cgYmVjb21lIGEgc2luZ2xlIHNwYWNlXG4gICAgICAgICAgICBjb21iaW5hdGlvbiA9IGNvbWJpbmF0aW9uLnJlcGxhY2UoL1xccysvZywgJyAnKTtcblxuICAgICAgICAgICAgdmFyIHNlcXVlbmNlID0gY29tYmluYXRpb24uc3BsaXQoJyAnKTtcbiAgICAgICAgICAgIHZhciBpbmZvO1xuXG4gICAgICAgICAgICAvLyBpZiB0aGlzIHBhdHRlcm4gaXMgYSBzZXF1ZW5jZSBvZiBrZXlzIHRoZW4gcnVuIHRocm91Z2ggdGhpcyBtZXRob2RcbiAgICAgICAgICAgIC8vIHRvIHJlcHJvY2VzcyBlYWNoIHBhdHRlcm4gb25lIGtleSBhdCBhIHRpbWVcbiAgICAgICAgICAgIGlmIChzZXF1ZW5jZS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgX2JpbmRTZXF1ZW5jZShjb21iaW5hdGlvbiwgc2VxdWVuY2UsIGNhbGxiYWNrLCBhY3Rpb24pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaW5mbyA9IF9nZXRLZXlJbmZvKGNvbWJpbmF0aW9uLCBhY3Rpb24pO1xuXG4gICAgICAgICAgICAvLyBtYWtlIHN1cmUgdG8gaW5pdGlhbGl6ZSBhcnJheSBpZiB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lXG4gICAgICAgICAgICAvLyBhIGNhbGxiYWNrIGlzIGFkZGVkIGZvciB0aGlzIGtleVxuICAgICAgICAgICAgc2VsZi5fY2FsbGJhY2tzW2luZm8ua2V5XSA9IHNlbGYuX2NhbGxiYWNrc1tpbmZvLmtleV0gfHwgW107XG5cbiAgICAgICAgICAgIC8vIHJlbW92ZSBhbiBleGlzdGluZyBtYXRjaCBpZiB0aGVyZSBpcyBvbmVcbiAgICAgICAgICAgIF9nZXRNYXRjaGVzKGluZm8ua2V5LCBpbmZvLm1vZGlmaWVycywge3R5cGU6IGluZm8uYWN0aW9ufSwgc2VxdWVuY2VOYW1lLCBjb21iaW5hdGlvbiwgbGV2ZWwpO1xuXG4gICAgICAgICAgICAvLyBhZGQgdGhpcyBjYWxsIGJhY2sgdG8gdGhlIGFycmF5XG4gICAgICAgICAgICAvLyBpZiBpdCBpcyBhIHNlcXVlbmNlIHB1dCBpdCBhdCB0aGUgYmVnaW5uaW5nXG4gICAgICAgICAgICAvLyBpZiBub3QgcHV0IGl0IGF0IHRoZSBlbmRcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyB0aGlzIGlzIGltcG9ydGFudCBiZWNhdXNlIHRoZSB3YXkgdGhlc2UgYXJlIHByb2Nlc3NlZCBleHBlY3RzXG4gICAgICAgICAgICAvLyB0aGUgc2VxdWVuY2Ugb25lcyB0byBjb21lIGZpcnN0XG4gICAgICAgICAgICBzZWxmLl9jYWxsYmFja3NbaW5mby5rZXldW3NlcXVlbmNlTmFtZSA/ICd1bnNoaWZ0JyA6ICdwdXNoJ10oe1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFjayxcbiAgICAgICAgICAgICAgICBtb2RpZmllcnM6IGluZm8ubW9kaWZpZXJzLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogaW5mby5hY3Rpb24sXG4gICAgICAgICAgICAgICAgc2VxOiBzZXF1ZW5jZU5hbWUsXG4gICAgICAgICAgICAgICAgbGV2ZWw6IGxldmVsLFxuICAgICAgICAgICAgICAgIGNvbWJvOiBjb21iaW5hdGlvblxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogYmluZHMgbXVsdGlwbGUgY29tYmluYXRpb25zIHRvIHRoZSBzYW1lIGNhbGxiYWNrXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IGNvbWJpbmF0aW9uc1xuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IGFjdGlvblxuICAgICAgICAgKiBAcmV0dXJucyB2b2lkXG4gICAgICAgICAqL1xuICAgICAgICBzZWxmLl9iaW5kTXVsdGlwbGUgPSBmdW5jdGlvbihjb21iaW5hdGlvbnMsIGNhbGxiYWNrLCBhY3Rpb24pIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29tYmluYXRpb25zLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgX2JpbmRTaW5nbGUoY29tYmluYXRpb25zW2ldLCBjYWxsYmFjaywgYWN0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzdGFydCFcbiAgICAgICAgX2FkZEV2ZW50KHRhcmdldEVsZW1lbnQsICdrZXlwcmVzcycsIF9oYW5kbGVLZXlFdmVudCk7XG4gICAgICAgIF9hZGRFdmVudCh0YXJnZXRFbGVtZW50LCAna2V5ZG93bicsIF9oYW5kbGVLZXlFdmVudCk7XG4gICAgICAgIF9hZGRFdmVudCh0YXJnZXRFbGVtZW50LCAna2V5dXAnLCBfaGFuZGxlS2V5RXZlbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGJpbmRzIGFuIGV2ZW50IHRvIG1vdXNldHJhcFxuICAgICAqXG4gICAgICogY2FuIGJlIGEgc2luZ2xlIGtleSwgYSBjb21iaW5hdGlvbiBvZiBrZXlzIHNlcGFyYXRlZCB3aXRoICssXG4gICAgICogYW4gYXJyYXkgb2Yga2V5cywgb3IgYSBzZXF1ZW5jZSBvZiBrZXlzIHNlcGFyYXRlZCBieSBzcGFjZXNcbiAgICAgKlxuICAgICAqIGJlIHN1cmUgdG8gbGlzdCB0aGUgbW9kaWZpZXIga2V5cyBmaXJzdCB0byBtYWtlIHN1cmUgdGhhdCB0aGVcbiAgICAgKiBjb3JyZWN0IGtleSBlbmRzIHVwIGdldHRpbmcgYm91bmQgKHRoZSBsYXN0IGtleSBpbiB0aGUgcGF0dGVybilcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfEFycmF5fSBrZXlzXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAgICAgKiBAcGFyYW0ge3N0cmluZz19IGFjdGlvbiAtICdrZXlwcmVzcycsICdrZXlkb3duJywgb3IgJ2tleXVwJ1xuICAgICAqIEByZXR1cm5zIHZvaWRcbiAgICAgKi9cbiAgICBNb3VzZXRyYXAucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbihrZXlzLCBjYWxsYmFjaywgYWN0aW9uKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAga2V5cyA9IGtleXMgaW5zdGFuY2VvZiBBcnJheSA/IGtleXMgOiBba2V5c107XG4gICAgICAgIHNlbGYuX2JpbmRNdWx0aXBsZS5jYWxsKHNlbGYsIGtleXMsIGNhbGxiYWNrLCBhY3Rpb24pO1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogdW5iaW5kcyBhbiBldmVudCB0byBtb3VzZXRyYXBcbiAgICAgKlxuICAgICAqIHRoZSB1bmJpbmRpbmcgc2V0cyB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gb2YgdGhlIHNwZWNpZmllZCBrZXkgY29tYm9cbiAgICAgKiB0byBhbiBlbXB0eSBmdW5jdGlvbiBhbmQgZGVsZXRlcyB0aGUgY29ycmVzcG9uZGluZyBrZXkgaW4gdGhlXG4gICAgICogX2RpcmVjdE1hcCBkaWN0LlxuICAgICAqXG4gICAgICogVE9ETzogYWN0dWFsbHkgcmVtb3ZlIHRoaXMgZnJvbSB0aGUgX2NhbGxiYWNrcyBkaWN0aW9uYXJ5IGluc3RlYWRcbiAgICAgKiBvZiBiaW5kaW5nIGFuIGVtcHR5IGZ1bmN0aW9uXG4gICAgICpcbiAgICAgKiB0aGUga2V5Y29tYm8rYWN0aW9uIGhhcyB0byBiZSBleGFjdGx5IHRoZSBzYW1lIGFzXG4gICAgICogaXQgd2FzIGRlZmluZWQgaW4gdGhlIGJpbmQgbWV0aG9kXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xBcnJheX0ga2V5c1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBhY3Rpb25cbiAgICAgKiBAcmV0dXJucyB2b2lkXG4gICAgICovXG4gICAgTW91c2V0cmFwLnByb3RvdHlwZS51bmJpbmQgPSBmdW5jdGlvbihrZXlzLCBhY3Rpb24pIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICByZXR1cm4gc2VsZi5iaW5kLmNhbGwoc2VsZiwga2V5cywgZnVuY3Rpb24oKSB7fSwgYWN0aW9uKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogdHJpZ2dlcnMgYW4gZXZlbnQgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIGJvdW5kXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5c1xuICAgICAqIEBwYXJhbSB7c3RyaW5nPX0gYWN0aW9uXG4gICAgICogQHJldHVybnMgdm9pZFxuICAgICAqL1xuICAgIE1vdXNldHJhcC5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uKGtleXMsIGFjdGlvbikge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmIChzZWxmLl9kaXJlY3RNYXBba2V5cyArICc6JyArIGFjdGlvbl0pIHtcbiAgICAgICAgICAgIHNlbGYuX2RpcmVjdE1hcFtrZXlzICsgJzonICsgYWN0aW9uXSh7fSwga2V5cyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIHJlc2V0cyB0aGUgbGlicmFyeSBiYWNrIHRvIGl0cyBpbml0aWFsIHN0YXRlLiAgdGhpcyBpcyB1c2VmdWxcbiAgICAgKiBpZiB5b3Ugd2FudCB0byBjbGVhciBvdXQgdGhlIGN1cnJlbnQga2V5Ym9hcmQgc2hvcnRjdXRzIGFuZCBiaW5kXG4gICAgICogbmV3IG9uZXMgLSBmb3IgZXhhbXBsZSBpZiB5b3Ugc3dpdGNoIHRvIGFub3RoZXIgcGFnZVxuICAgICAqXG4gICAgICogQHJldHVybnMgdm9pZFxuICAgICAqL1xuICAgIE1vdXNldHJhcC5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLl9jYWxsYmFja3MgPSB7fTtcbiAgICAgICAgc2VsZi5fZGlyZWN0TWFwID0ge307XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBzaG91bGQgd2Ugc3RvcCB0aGlzIGV2ZW50IGJlZm9yZSBmaXJpbmcgb2ZmIGNhbGxiYWNrc1xuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudH0gZVxuICAgICAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudFxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAgICovXG4gICAgTW91c2V0cmFwLnByb3RvdHlwZS5zdG9wQ2FsbGJhY2sgPSBmdW5jdGlvbihlLCBlbGVtZW50KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAvLyBpZiB0aGUgZWxlbWVudCBoYXMgdGhlIGNsYXNzIFwibW91c2V0cmFwXCIgdGhlbiBubyBuZWVkIHRvIHN0b3BcbiAgICAgICAgaWYgKCgnICcgKyBlbGVtZW50LmNsYXNzTmFtZSArICcgJykuaW5kZXhPZignIG1vdXNldHJhcCAnKSA+IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoX2JlbG9uZ3NUbyhlbGVtZW50LCBzZWxmLnRhcmdldCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHN0b3AgZm9yIGlucHV0LCBzZWxlY3QsIGFuZCB0ZXh0YXJlYVxuICAgICAgICByZXR1cm4gZWxlbWVudC50YWdOYW1lID09ICdJTlBVVCcgfHwgZWxlbWVudC50YWdOYW1lID09ICdTRUxFQ1QnIHx8IGVsZW1lbnQudGFnTmFtZSA9PSAnVEVYVEFSRUEnIHx8IGVsZW1lbnQuaXNDb250ZW50RWRpdGFibGU7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIGV4cG9zZXMgX2hhbmRsZUtleSBwdWJsaWNseSBzbyBpdCBjYW4gYmUgb3ZlcndyaXR0ZW4gYnkgZXh0ZW5zaW9uc1xuICAgICAqL1xuICAgIE1vdXNldHJhcC5wcm90b3R5cGUuaGFuZGxlS2V5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHNlbGYuX2hhbmRsZUtleS5hcHBseShzZWxmLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBJbml0IHRoZSBnbG9iYWwgbW91c2V0cmFwIGZ1bmN0aW9uc1xuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgaXMgbmVlZGVkIHRvIGFsbG93IHRoZSBnbG9iYWwgbW91c2V0cmFwIGZ1bmN0aW9ucyB0byB3b3JrXG4gICAgICogbm93IHRoYXQgbW91c2V0cmFwIGlzIGEgY29uc3RydWN0b3IgZnVuY3Rpb24uXG4gICAgICovXG4gICAgTW91c2V0cmFwLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRvY3VtZW50TW91c2V0cmFwID0gTW91c2V0cmFwKGRvY3VtZW50KTtcbiAgICAgICAgZm9yICh2YXIgbWV0aG9kIGluIGRvY3VtZW50TW91c2V0cmFwKSB7XG4gICAgICAgICAgICBpZiAobWV0aG9kLmNoYXJBdCgwKSAhPT0gJ18nKSB7XG4gICAgICAgICAgICAgICAgTW91c2V0cmFwW21ldGhvZF0gPSAoZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkb2N1bWVudE1vdXNldHJhcFttZXRob2RdLmFwcGx5KGRvY3VtZW50TW91c2V0cmFwLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0gKG1ldGhvZCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIE1vdXNldHJhcC5pbml0KCk7XG5cbiAgICAvLyBleHBvc2UgbW91c2V0cmFwIHRvIHRoZSBnbG9iYWwgb2JqZWN0XG4gICAgd2luZG93Lk1vdXNldHJhcCA9IE1vdXNldHJhcDtcblxuICAgIC8vIGV4cG9zZSBhcyBhIGNvbW1vbiBqcyBtb2R1bGVcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBNb3VzZXRyYXA7XG4gICAgfVxuXG4gICAgLy8gZXhwb3NlIG1vdXNldHJhcCBhcyBhbiBBTUQgbW9kdWxlXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gTW91c2V0cmFwO1xuICAgICAgICB9KTtcbiAgICB9XG59KSAod2luZG93LCBkb2N1bWVudCk7XG4iLCJ2YXIgRmlsZVVwbG9hZCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgaGFuZGxlU3VibWl0OiBmdW5jdGlvbihlKXtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgLy8gU2hvdyBwcm9ncmVzc2JhclxuICAgIHZhciBwcm9ncmVzcyA9IGZ1bmN0aW9uKGUpe1xuICAgICAgLy8gc2hvdyBwcm9ncmVzcyBiYXJcbiAgICAgIGlmKGUubGVuZ3RoQ29tcHV0YWJsZSl7XG4gICAgICAgICAgdmFyIG1heCA9IGUudG90YWw7XG4gICAgICAgICAgdmFyIGN1cnJlbnQgPSBlLmxvYWRlZDtcbiAgICAgICAgICB2YXIgUGVyY2VudGFnZSA9IChjdXJyZW50ICogMTAwKS9tYXg7XG4gICAgICAgICAgJChcIi5wcm9ncmVzc1wiK1wiLW1ldGVyXCIpLndpZHRoKFBlcmNlbnRhZ2UrJyUnKVxuICAgICAgICAgICQoXCIucHJvZ3Jlc3NcIitcIi1tZXRlci10ZXh0XCIpLnRleHQocGFyc2VJbnQoUGVyY2VudGFnZSkrJyUnKVxuICAgICAgICAgIGlmKFBlcmNlbnRhZ2UgPj0gMTAwKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAvLyB2YXIgZmlsZW5hbWUgPSAgICQoXCIjZmlsZW5hbWVcIikudGV4dCgpO1xuICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiZmluaXNoZWRcIik7XG4gICAgICAgICAgICAgLy8gcHJvY2VzcyBjb21wbGV0ZWRcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICAkKFwiI3Byb2dyZXNzYmFyXCIpWzBdLmNsYXNzTmFtZSA9IFwicHJvZ3Jlc3NcIjtcbiAgICB2YXIgZmlsZV9kYXRhID0gbmV3IEZvcm1EYXRhKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidXBsb2FkRm9ybVwiKSk7XG4gICAgZmlsZV9kYXRhLmFwcGVuZChcImxhYmVsXCIsIFwiV0VCVVBMT0FEXCIpO1xuICAgICQuYWpheCh7XG4gICAgICB1cmw6IFwiL3VwbG9hZFwiLFxuICAgICAgdHlwZTogXCJQT1NUXCIsXG4gICAgICBkYXRhOiBmaWxlX2RhdGEsXG4gICAgICB4aHI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgdmFyIHNldHRpbmdzID0gJC5hamF4U2V0dGluZ3MueGhyKCk7XG4gICAgICAgICBpZihzZXR0aW5ncy51cGxvYWQpe1xuICAgICAgICAgICAgIHNldHRpbmdzLnVwbG9hZC5hZGRFdmVudExpc3RlbmVyKCdwcm9ncmVzcycscHJvZ3Jlc3MsIGZhbHNlKTtcbiAgICAgICAgIH1cbiAgICAgICAgIHJldHVybiBzZXR0aW5ncztcbiAgICAgIH0sXG4gICAgICBlbmN0eXBlOiAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScsXG4gICAgICBwcm9jZXNzRGF0YTogZmFsc2UsXG4gICAgICBjb250ZW50VHlwZTogZmFsc2VcbiAgICB9KS5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgLy8gcnVuIG5leHQgc3RlcCBoZXJlIDogYXNrIHNlcnZlciBzaWRlXG4gICAgICAgIHdpbmRvdy5yZW5kZXJGaWxlKFwidXBsb2Fkcy9cIitkYXRhLnRvU3RyaW5nKCkpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyh3aW5kb3cuZmlsZVRvUmVuZGVyKTtcbiAgICB9KTtcbiAgfSxcbiAgc2hvd0ZpbGVuYW1lOiBmdW5jdGlvbihlKXtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgJChcIiNmaWxlbmFtZVwiKS50ZXh0KGUudGFyZ2V0LmZpbGVzWzBdLm5hbWUpO1xuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICAgIDxoNT4gQ2hvb3NlIGEgZmlsZSB5b3Ugd2FudCB0byBleHRyYWN0IGEgdGFibGUgZnJvbSAoaW1hZ2Ugb3IgcGRmKTwvaDU+XG4gICAgICAgICAgPGZvcm0gaWQ9XCJ1cGxvYWRGb3JtXCIgbWV0aG9kPVwicG9zdFwiIGVuY1R5cGU9XCJtdWx0aXBhcnQvZm9ybS1kYXRhXCIgb25TdWJtaXQ9e3RoaXMuaGFuZGxlU3VibWl0fT5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJidXR0b24gaG9sbG93XCI+XG4gICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJoaWRlXCIgdHlwZT1cImZpbGVcIiBuYW1lPVwidG9Db252ZXJ0XCIgb25DaGFuZ2U9e3RoaXMuc2hvd0ZpbGVuYW1lfS8+XG4gICAgICAgICAgICAgIDxzcGFuPiBTZWxlY3QgYSBmaWxlIDwvc3Bhbj5cbiAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwiYnV0dG9uXCIgdHlwZT1cInN1Ym1pdFwiIHZhbHVlPVwiVXBsb2FkXCIgbmFtZT1cInN1Ym1pdFwiLz5cbiAgICAgICAgICAgIDxsYWJlbCBpZD1cImZpbGVuYW1lXCI+PC9sYWJlbD5cbiAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgICAgPGRpdiBpZD1cInByb2dyZXNzYmFyXCIgY2xhc3NOYW1lPVwicHJvZ3Jlc3MgaGlkZVwiIHJvbGU9XCJwcm9ncmVzc2JhclwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwcm9ncmVzcy1tZXRlclwiPlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJwcm9ncmVzcy1tZXRlci10ZXh0XCI+IDAgJSA8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVVcGxvYWQ7XG4iLCJ2YXIgSW1hZ2UgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpe1xuICAgIGNvbnNvbGUubG9nKFwiTW91bnRlZFwiKTtcbiAgICB2YXIgaW1nID0gJChcIi5pbWctbGF5ZXJcIik7XG4gICAgaW1nLm9uKCdsb2FkJywgZnVuY3Rpb24oKXtcbiAgICAgIGNvbnNvbGUubG9nKFwiUmVhZHkgLi4uXCIpO1xuICAgICAgJChcIiNjYW52YXNMYXllclwiKS5hdHRyKHtcImhlaWdodFwiOmltZy5oZWlnaHQoKStcInB4XCIsIFwid2lkdGhcIjppbWcud2lkdGgoKStcInB4XCJ9KTtcbiAgICB9KTtcblxuICB9LFxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY2VudGVyIG1hcmdpblwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic21hbGwtMTIgbGFyZ2UtMTIgbWVkaXVtLTEyIGNvbHVtbnNcIj5cbiAgICAgICAgICAgIDxoNT4gQ2hvb3NlIGFyZWEgb2YgaW50ZXJlc3QgLi4uIGFuZCA8YnV0dG9uIGlkPVwidmFsaWRhdGVcIiBjbGFzc05hbWU9XCJidXR0b24gaG9sbG93XCI+IFZhbGlkYXRlIDwvYnV0dG9uPiA8L2g1PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic21hbGwtMTIgbGFyZ2UtMTIgbWVkaXVtLTEyIGNvbHVtbnNcIj5cbiAgICAgICAgICAgIDxpbWcgY2xhc3NOYW1lPVwiaW1nLWxheWVyIHRodW1ibmFpbFwiIHNyYz17dGhpcy5wcm9wcy5zb3VyY2V9IC8+XG4gICAgICAgICAgICA8Y2FudmFzIGNsYXNzTmFtZT1cImNhbnZhcy1sYXllclwiIGlkPVwiY2FudmFzTGF5ZXJcIj5cbiAgICAgICAgICAgIDwvY2FudmFzPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4vZGlzcGF0Y2hlcicpO1xudmFyIEhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKTtcblxudmFyIENlbGxDb21wb25lbnQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgICAvKipcbiAgICAgKiBSZWFjdCBcImdldEluaXRpYWxTdGF0ZVwiIG1ldGhvZCwgc2V0dGluZyB3aGV0aGVyIG9yIG5vdFxuICAgICAqIHRoZSBjZWxsIGlzIGJlaW5nIGVkaXRlZCBhbmQgaXRzIGNoYW5naW5nIHZhbHVlXG4gICAgICovXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGVkaXRpbmc6IHRoaXMucHJvcHMuZWRpdGluZyxcbiAgICAgICAgICAgIGNoYW5nZWRWYWx1ZTogdGhpcy5wcm9wcy52YWx1ZVxuICAgICAgICB9O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZWFjdCBcInJlbmRlclwiIG1ldGhvZCwgcmVuZGVyaW5nIHRoZSBpbmRpdmlkdWFsIGNlbGxcbiAgICAgKi9cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZWN0ZWQgPSAodGhpcy5wcm9wcy5zZWxlY3RlZCkgPyAnc2VsZWN0ZWQnIDogJycsXG4gICAgICAgICAgICByZWYgPSAnaW5wdXRfJyArIHRoaXMucHJvcHMudWlkLmpvaW4oJ18nKSxcbiAgICAgICAgICAgIGVtcHR5VmFsdWVTeW1ib2wgPSB0aGlzLnByb3BzLmNvbmZpZy5lbXB0eVZhbHVlU3ltYm9sIHx8ICcnLFxuICAgICAgICAgICAgZGlzcGxheVZhbHVlID0gKHRoaXMucHJvcHMudmFsdWUgPT09ICcnIHx8ICF0aGlzLnByb3BzLnZhbHVlKSA/IGVtcHR5VmFsdWVTeW1ib2wgOiB0aGlzLnByb3BzLnZhbHVlLFxuICAgICAgICAgICAgY2VsbENsYXNzZXMgPSAodGhpcy5wcm9wcy5jZWxsQ2xhc3Nlcy5sZW5ndGggPiAwKSA/IHRoaXMucHJvcHMuY2VsbENsYXNzZXMgKyAnICcgKyBzZWxlY3RlZCA6IHNlbGVjdGVkLFxuICAgICAgICAgICAgY2VsbENvbnRlbnQ7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgaGVhZGVyIC0gaWYgeWVzLCByZW5kZXIgaXRcbiAgICAgICAgdmFyIGhlYWRlciA9IHRoaXMucmVuZGVySGVhZGVyKCk7XG4gICAgICAgIGlmIChoZWFkZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBoZWFkZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBub3QgYSBoZWFkZXIsIGNoZWNrIGZvciBlZGl0aW5nIGFuZCByZXR1cm5cbiAgICAgICAgaWYgKHRoaXMucHJvcHMuc2VsZWN0ZWQgJiYgdGhpcy5wcm9wcy5lZGl0aW5nKSB7XG4gICAgICAgICAgICBjZWxsQ29udGVudCA9IChcbiAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwibW91c2V0cmFwXCJcbiAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e3RoaXMuaGFuZGxlQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9e3RoaXMuaGFuZGxlQmx1cn1cbiAgICAgICAgICAgICAgICAgICAgICAgcmVmPXtyZWZ9XG4gICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17dGhpcy5wcm9wcy52YWx1ZX0gLz5cbiAgICAgICAgICAgIClcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8dGQgY2xhc3NOYW1lPXtjZWxsQ2xhc3Nlc30gcmVmPXt0aGlzLnByb3BzLnVpZC5qb2luKCdfJyl9PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVhY3RUYWJsZUNlbGxcIj5cbiAgICAgICAgICAgICAgICAgICAge2NlbGxDb250ZW50fVxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBvbkRvdWJsZUNsaWNrPXt0aGlzLmhhbmRsZURvdWJsZUNsaWNrfSBvbkNsaWNrPXt0aGlzLmhhbmRsZUNsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtkaXNwbGF5VmFsdWV9XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlYWN0IFwiY29tcG9uZW50RGlkVXBkYXRlXCIgbWV0aG9kLCBlbnN1cmluZyBjb3JyZWN0IGlucHV0IGZvY3VzXG4gICAgICogQHBhcmFtICB7UmVhY3QgcHJldmlvdXMgcHJvcGVydGllc30gcHJldlByb3BzXG4gICAgICogQHBhcmFtICB7UmVhY3QgcHJldmlvdXMgc3RhdGV9IHByZXZTdGF0ZVxuICAgICAqL1xuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24ocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcbiAgICAgICAgaWYgKHRoaXMucHJvcHMuZWRpdGluZyAmJiB0aGlzLnByb3BzLnNlbGVjdGVkKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IFJlYWN0RE9NLmZpbmRET01Ob2RlKHRoaXMucmVmc1snaW5wdXRfJyArIHRoaXMucHJvcHMudWlkLmpvaW4oJ18nKV0pO1xuICAgICAgICAgICAgbm9kZS5mb2N1cygpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByZXZQcm9wcy5zZWxlY3RlZCAmJiBwcmV2UHJvcHMuZWRpdGluZyAmJiB0aGlzLnN0YXRlLmNoYW5nZWRWYWx1ZSAhPT0gdGhpcy5wcm9wcy52YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkNlbGxWYWx1ZUNoYW5nZSh0aGlzLnByb3BzLnVpZCwgdGhpcy5zdGF0ZS5jaGFuZ2VkVmFsdWUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsaWNrIGhhbmRsZXIgZm9yIGluZGl2aWR1YWwgY2VsbCwgZW5zdXJpbmcgbmF2aWdhdGlvbiBhbmQgc2VsZWN0aW9uXG4gICAgICogQHBhcmFtICB7ZXZlbnR9IGVcbiAgICAgKi9cbiAgICBoYW5kbGVDbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIGNlbGxFbGVtZW50ID0gUmVhY3RET00uZmluZERPTU5vZGUodGhpcy5yZWZzW3RoaXMucHJvcHMudWlkLmpvaW4oJ18nKV0pO1xuICAgICAgICB0aGlzLnByb3BzLmhhbmRsZVNlbGVjdENlbGwodGhpcy5wcm9wcy51aWQsIGNlbGxFbGVtZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xpY2sgaGFuZGxlciBmb3IgaW5kaXZpZHVhbCBjZWxsIGlmIHRoZSBjZWxsIGlzIGEgaGVhZGVyIGNlbGxcbiAgICAgKiBAcGFyYW0gIHtldmVudH0gZVxuICAgICAqL1xuICAgIGhhbmRsZUhlYWRDbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIGNlbGxFbGVtZW50ID0gUmVhY3RET00uZmluZERPTU5vZGUodGhpcy5yZWZzW3RoaXMucHJvcHMudWlkLmpvaW4oJ18nKV0pO1xuICAgICAgICBEaXNwYXRjaGVyLnB1Ymxpc2goJ2hlYWRDZWxsQ2xpY2tlZCcsIGNlbGxFbGVtZW50LCB0aGlzLnByb3BzLnNwcmVhZHNoZWV0SWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEb3VibGUgY2xpY2sgaGFuZGxlciBmb3IgaW5kaXZpZHVhbCBjZWxsLCBlbnN1cmluZyBuYXZpZ2F0aW9uIGFuZCBzZWxlY3Rpb25cbiAgICAgKiBAcGFyYW0gIHtldmVudH0gZVxuICAgICAqL1xuICAgIGhhbmRsZURvdWJsZUNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMucHJvcHMuaGFuZGxlRG91YmxlQ2xpY2tPbkNlbGwodGhpcy5wcm9wcy51aWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBCbHVyIGhhbmRsZXIgZm9yIGluZGl2aWR1YWwgY2VsbFxuICAgICAqIEBwYXJhbSAge2V2ZW50fSBlXG4gICAgICovXG4gICAgaGFuZGxlQmx1cjogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIG5ld1ZhbHVlID0gUmVhY3RET00uZmluZERPTU5vZGUodGhpcy5yZWZzWydpbnB1dF8nICsgdGhpcy5wcm9wcy51aWQuam9pbignXycpXSkudmFsdWU7XG5cbiAgICAgICAgdGhpcy5wcm9wcy5vbkNlbGxWYWx1ZUNoYW5nZSh0aGlzLnByb3BzLnVpZCwgbmV3VmFsdWUsIGUpO1xuICAgICAgICB0aGlzLnByb3BzLmhhbmRsZUNlbGxCbHVyKHRoaXMucHJvcHMudWlkKTtcbiAgICAgICAgRGlzcGF0Y2hlci5wdWJsaXNoKCdjZWxsQmx1cnJlZCcsIHRoaXMucHJvcHMudWlkLCB0aGlzLnByb3BzLnNwcmVhZHNoZWV0SWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGFuZ2UgaGFuZGxlciBmb3IgYW4gaW5kaXZpZHVhbCBjZWxsLCBwcm9wYWdhdGluZyB0aGUgdmFsdWUgY2hhbmdlXG4gICAgICogQHBhcmFtICB7ZXZlbnR9IGVcbiAgICAgKi9cbiAgICBoYW5kbGVDaGFuZ2U6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBuZXdWYWx1ZSA9IFJlYWN0RE9NLmZpbmRET01Ob2RlKHRoaXMucmVmc1snaW5wdXRfJyArIHRoaXMucHJvcHMudWlkLmpvaW4oJ18nKV0pLnZhbHVlO1xuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2NoYW5nZWRWYWx1ZTogbmV3VmFsdWV9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGEgaGVhZGVyIGV4aXN0cyAtIGlmIGl0IGRvZXMsIGl0IHJldHVybnMgYSBoZWFkZXIgb2JqZWN0XG4gICAgICogQHJldHVybiB7ZmFsc2V8cmVhY3R9IFtFaXRoZXIgZmFsc2UgaWYgaXQncyBub3QgYSBoZWFkZXIgY2VsbCwgYSByZWFjdCBvYmplY3QgaWYgaXQgaXNdXG4gICAgICovXG4gICAgcmVuZGVySGVhZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZCA9ICh0aGlzLnByb3BzLnNlbGVjdGVkKSA/ICdzZWxlY3RlZCcgOiAnJyxcbiAgICAgICAgICAgIHVpZCA9IHRoaXMucHJvcHMudWlkLFxuICAgICAgICAgICAgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWcsXG4gICAgICAgICAgICBlbXB0eVZhbHVlU3ltYm9sID0gdGhpcy5wcm9wcy5jb25maWcuZW1wdHlWYWx1ZVN5bWJvbCB8fCAnJyxcbiAgICAgICAgICAgIGRpc3BsYXlWYWx1ZSA9ICh0aGlzLnByb3BzLnZhbHVlID09PSAnJyB8fCAhdGhpcy5wcm9wcy52YWx1ZSkgPyBlbXB0eVZhbHVlU3ltYm9sIDogdGhpcy5wcm9wcy52YWx1ZSxcbiAgICAgICAgICAgIGNlbGxDbGFzc2VzID0gKHRoaXMucHJvcHMuY2VsbENsYXNzZXMubGVuZ3RoID4gMCkgPyB0aGlzLnByb3BzLmNlbGxDbGFzc2VzICsgJyAnICsgc2VsZWN0ZWQgOiBzZWxlY3RlZDtcblxuICAgICAgICAvLyBDYXNlc1xuICAgICAgICB2YXIgaGVhZFJvdyA9ICh1aWRbMF0gPT09IDApLFxuICAgICAgICAgICAgaGVhZENvbHVtbiA9ICh1aWRbMV0gPT09IDApLFxuICAgICAgICAgICAgaGVhZFJvd0FuZEVuYWJsZWQgPSAoY29uZmlnLmhhc0hlYWRSb3cgJiYgdWlkWzBdID09PSAwKSxcbiAgICAgICAgICAgIGhlYWRDb2x1bW5BbmRFbmFibGVkID0gKGNvbmZpZy5oYXNIZWFkQ29sdW1uICYmIHVpZFsxXSA9PT0gMClcblxuICAgICAgICAvLyBIZWFkIFJvdyBlbmFibGVkLCBjZWxsIGlzIGluIGhlYWQgcm93XG4gICAgICAgIC8vIEhlYWQgQ29sdW1uIGVuYWJsZWQsIGNlbGwgaXMgaW4gaGVhZCBjb2x1bW5cbiAgICAgICAgaWYgKGhlYWRSb3dBbmRFbmFibGVkIHx8IGhlYWRDb2x1bW5BbmRFbmFibGVkKSB7XG4gICAgICAgICAgICBpZiAoaGVhZENvbHVtbiAmJiBjb25maWcuaGFzTGV0dGVyTnVtYmVySGVhZHMpIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5VmFsdWUgPSB1aWRbMF07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhlYWRSb3cgJiYgY29uZmlnLmhhc0xldHRlck51bWJlckhlYWRzKSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheVZhbHVlID0gSGVscGVycy5jb3VudFdpdGhMZXR0ZXJzKHVpZFsxXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgoY29uZmlnLmlzSGVhZFJvd1N0cmluZyAmJiBoZWFkUm93KSB8fCAoY29uZmlnLmlzSGVhZENvbHVtblN0cmluZyAmJiBoZWFkQ29sdW1uKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9e2NlbGxDbGFzc2VzfSByZWY9e3RoaXMucHJvcHMudWlkLmpvaW4oJ18nKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIG9uQ2xpY2s9e3RoaXMuaGFuZGxlSGVhZENsaWNrfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2Rpc3BsYXlWYWx1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICA8dGggcmVmPXt0aGlzLnByb3BzLnVpZC5qb2luKCdfJyl9PlxuICAgICAgICAgICAgICAgICAgICAgICAge2Rpc3BsYXlWYWx1ZX1cbiAgICAgICAgICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2VsbENvbXBvbmVudDtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgTW91c2V0cmFwID0gcmVxdWlyZSgnbW91c2V0cmFwJyk7XG5cbnZhciBkaXNwYXRjaGVyID0ge1xuICAgIC8vIEV2ZW50IFB1Yi9TdWIgU3lzdGVtXG4gICAgLy9cbiAgICAvLyBUb3BpY3MgdXNlZDpcbiAgICAvLyBbaGVhZENlbGxDbGlja2VkXSAtIEEgaGVhZCBjZWxsIHdhcyBjbGlja2VkXG4gICAgLy8gICAgICBAcmV0dXJuIHthcnJheX0gW3JvdywgY29sdW1uXVxuICAgIC8vIFtjZWxsU2VsZWN0ZWRdIC0gQSBjZWxsIHdhcyBzZWxlY3RlZFxuICAgIC8vICAgICAgQHJldHVybiB7YXJyYXl9IFtyb3csIGNvbHVtbl1cbiAgICAvLyBbY2VsbEJsdXJdIC0gQSBjZWxsIHdhcyBibHVycmVkXG4gICAgLy8gICAgICBAcmV0dXJuIHthcnJheX0gW3JvdywgY29sdW1uXVxuICAgIC8vIFtjZWxsVmFsdWVDaGFuZ2VkXSAtIEEgY2VsbCB2YWx1ZSBjaGFuZ2VkLlxuICAgIC8vICAgICAgQHJldHVybiB7Y2VsbCwgbmV3VmFsdWV9IE9yaWdpbiBjZWxsLCBuZXcgdmFsdWUgZW50ZXJlZFxuICAgIC8vIFtkYXRhQ2hhbmdlZF0gLSBEYXRhIGNoYW5nZWRcbiAgICAvLyAgICAgIEByZXR1cm4ge2RhdGF9IE5ldyBkYXRhXG4gICAgLy8gW2VkaXRTdGFydGVkXSAtIFRoZSB1c2VyIHN0YXJ0ZWQgZWRpdGluZ1xuICAgIC8vICAgICAgQHJldHVybiB7Y2VsbH0gT3JpZ2luIGNlbGxcbiAgICAvLyBbZWRpdFN0b3BwZWRdIC0gVGhlIHVzZXIgc3RvcHBlZCBlZGl0aW5nXG4gICAgLy8gICAgICBAcmV0dXJuIHtjZWxsfSBPcmlnaW4gY2VsbFxuICAgIC8vIFtyb3dDcmVhdGVkXSAtIFRoZSB1c2VyIGNyZWF0ZWQgYSByb3dcbiAgICAvLyAgICAgIEByZXR1cm4ge251bWJlcn0gUm93IGluZGV4XG4gICAgLy8gW2NvbHVtbkNyZWF0ZWRdIC0gVGhlIHVzZXIgY3JlYXRlZCBhIGNvbHVtblxuICAgIC8vICAgICAgQHJldHVybiB7bnVtYmVyfSBDb2x1bW4gaW5kZXhcbiAgICB0b3BpY3M6IHt9LFxuXG4gICAgLyoqXG4gICAgICogU3Vic2NyaWJlIHRvIGFuIGV2ZW50XG4gICAgICogQHBhcmFtICB7c3RyaW5nfSB0b3BpYyAgICAgICAgIFtUaGUgdG9waWMgc3Vic2NyaWJpbmcgdG9dXG4gICAgICogQHBhcmFtICB7ZnVuY3Rpb259IGxpc3RlbmVyICAgIFtUaGUgY2FsbGJhY2sgZm9yIHB1Ymxpc2hlZCBldmVudHNdXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSBzcHJlYWRzaGVldElkIFtUaGUgcmVhY3RJZCAoZGF0YS1zcHJlYWRzaGVldElkKSBvZiB0aGUgb3JpZ2luIGVsZW1lbnRdXG4gICAgICovXG4gICAgc3Vic2NyaWJlOiBmdW5jdGlvbih0b3BpYywgbGlzdGVuZXIsIHNwcmVhZHNoZWV0SWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLnRvcGljc1tzcHJlYWRzaGVldElkXSkge1xuICAgICAgICAgICAgdGhpcy50b3BpY3Nbc3ByZWFkc2hlZXRJZF0gPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy50b3BpY3Nbc3ByZWFkc2hlZXRJZF1bdG9waWNdKSB7XG4gICAgICAgICAgICB0aGlzLnRvcGljc1tzcHJlYWRzaGVldElkXVt0b3BpY10gPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudG9waWNzW3NwcmVhZHNoZWV0SWRdW3RvcGljXS5wdXNoKGxpc3RlbmVyKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHVibGlzaCB0byBhbiBldmVudCBjaGFubmVsXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSB0b3BpYyAgICAgICAgIFtUaGUgdG9waWMgcHVibGlzaGluZyB0b11cbiAgICAgKiBAcGFyYW0gIHtvYmplY3R9IGRhdGEgICAgICAgICAgW0FuIG9iamVjdCBwYXNzZWQgdG8gdGhlIHN1YnNjcmliZWQgY2FsbGJhY2tzXVxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gc3ByZWFkc2hlZXRJZCBbVGhlIHJlYWN0SWQgKGRhdGEtc3ByZWFkc2hlZXRJZCkgb2YgdGhlIG9yaWdpbiBlbGVtZW50XVxuICAgICAqL1xuICAgIHB1Ymxpc2g6IGZ1bmN0aW9uKHRvcGljLCBkYXRhLCBzcHJlYWRzaGVldElkKSB7XG4gICAgICAgIC8vIHJldHVybiBpZiB0aGUgdG9waWMgZG9lc24ndCBleGlzdCwgb3IgdGhlcmUgYXJlIG5vIGxpc3RlbmVyc1xuICAgICAgICBpZiAoIXRoaXMudG9waWNzW3NwcmVhZHNoZWV0SWRdIHx8ICF0aGlzLnRvcGljc1tzcHJlYWRzaGVldElkXVt0b3BpY10gfHwgdGhpcy50b3BpY3Nbc3ByZWFkc2hlZXRJZF1bdG9waWNdLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50b3BpY3Nbc3ByZWFkc2hlZXRJZF1bdG9waWNdLmZvckVhY2goZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGxpc3RlbmVyKGRhdGEgfHwge30pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAga2V5Ym9hcmRTaG9ydGN1dHM6IFtcbiAgICAgICAgLy8gTmFtZSwgS2V5cywgRXZlbnRzXG4gICAgICAgIFsnZG93bicsICdkb3duJywgWydrZXl1cCddXSxcbiAgICAgICAgWyd1cCcsICd1cCcsIFsna2V5dXAnXV0sXG4gICAgICAgIFsnbGVmdCcsICdsZWZ0JywgWydrZXl1cCddXSxcbiAgICAgICAgWydyaWdodCcsICdyaWdodCcsIFsna2V5dXAnXV0sXG4gICAgICAgIFsndGFiJywgJ3RhYicsIFsna2V5dXAnLCAna2V5ZG93biddXSxcbiAgICAgICAgWydlbnRlcicsICdlbnRlcicsIFsna2V5dXAnXV0sXG4gICAgICAgIFsnZXNjJywgJ2VzYycsIFsna2V5dXAnXV0sXG4gICAgICAgIFsncmVtb3ZlJywgWydiYWNrc3BhY2UnLCAnZGVsZXRlJ10sIFsna2V5dXAnLCAna2V5ZG93biddXSxcbiAgICAgICAgWydsZXR0ZXInLCBbJ2EnLCAnYicsICdjJywgJ2QnLCAnZScsICdmJywgJ2cnLCAnaCcsICdpJywgJ2onLCAnaycsICdsJywgJ20nLCAnbicsICdvJywgJ3AnLCAncScsICdyJywgJ3MnLCAndCcsICd1JywgJ3YnLCAneCcsICd3JywgJ3knLCAneicsICcxJywgJzInLCAnMycsICc0JywgJzUnLCAnNicsICc3JywgJzgnLCAnOScsICcwJywgJz0nLCAnLicsICcsJywgJ0EnLCAnQicsICdDJywgJ0QnLCAnRScsICdGJywgJ0cnLCAnSCcsICdJJywgJ0onLCAnSycsICdMJywgJ00nLCAnTicsICdPJywgJ1AnLCAnUScsICdSJywgJ1MnLCAnVCcsICdVJywgJ1YnLCAnWCcsICdXJywgJ1knLCAnWiddLCBbJ2tleXVwJywgJ2tleWRvd24nXV1cbiAgICBdLFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIGtleWJvYXJkIGJpbmRpbmdzXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRvbU5vZGUgW1RoZSBET00gbm9kZSBvZiB0aGUgZWxlbWVudCB0aGF0IHNob3VsZCBiZSBib3VuZF1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3ByZWFkc2hlZXRJZCBbVGhlIGlkIG9mIHRoZSBzcHJlYWRzaGVldCBlbGVtZW50XVxuICAgICAqL1xuICAgIHNldHVwS2V5Ym9hcmRTaG9ydGN1dHM6IGZ1bmN0aW9uIChkb21Ob2RlLCBzcHJlYWRzaGVldElkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICB0aGlzLmtleWJvYXJkU2hvcnRjdXRzLm1hcChmdW5jdGlvbiAoc2hvcnRjdXQpIHtcbiAgICAgICAgICAgIHZhciBzaG9ydGN1dE5hbWUgPSBzaG9ydGN1dFswXSxcbiAgICAgICAgICAgICAgICBzaG9ydGN1dEtleSA9IHNob3J0Y3V0WzFdLFxuICAgICAgICAgICAgICAgIGV2ZW50cyA9IHNob3J0Y3V0WzJdO1xuXG4gICAgICAgICAgICBldmVudHMubWFwKGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICBNb3VzZXRyYXAoZG9tTm9kZSkuYmluZChzaG9ydGN1dEtleSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5wdWJsaXNoKHNob3J0Y3V0TmFtZSArICdfJyArIGV2ZW50LCBlLCBzcHJlYWRzaGVldElkKTtcbiAgICAgICAgICAgICAgICB9LCBldmVudCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBBdm9pZCBzY3JvbGxcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAvLyBzcGFjZSBhbmQgYXJyb3cga2V5c1xuICAgICAgICAgICAgaWYgKFszMiwgMzcsIDM4LCAzOSwgNDBdLmluZGV4T2YoZS5rZXlDb2RlKSA+IC0xICYmICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudClbMF0udGFnTmFtZSAhPT0gJ0lOUFVUJykge1xuICAgICAgICAgICAgICAgIGlmIChlLnByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBPaCwgb2xkIElFLCB5b3Ug8J+SqVxuICAgICAgICAgICAgICAgICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBmYWxzZSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBkaXNwYXRjaGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBIZWxwZXJzID0ge1xuICAgIC8qKlxuICAgICAqIEZpbmQgdGhlIGZpcnN0IGVsZW1lbnQgaW4gYW4gYXJyYXkgbWF0Y2hpbmcgYSBib29sZWFuXG4gICAgICogQHBhcmFtICB7W2FycmF5XX0gYXJyICAgICBbQXJyYXkgdG8gdGVzdF1cbiAgICAgKiBAcGFyYW0gIHtbZnVuY3Rpb25dfSB0ZXN0IFtUZXN0IEZ1bmN0aW9uXVxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gY29udGV4dCAgW0NvbnRleHRdXG4gICAgICogQHJldHVybiB7W29iamVjdF19ICAgICAgICBbRm91bmQgZWxlbWVudF1cbiAgICAgKi9cbiAgICBmaXJzdEluQXJyYXk6IGZ1bmN0aW9uIChhcnIsIHRlc3QsIGNvbnRleHQpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IG51bGw7XG5cbiAgICAgICAgYXJyLnNvbWUoZnVuY3Rpb24oZWwsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0LmNhbGwoY29udGV4dCwgZWwsIGksIGFycikgPyAoKHJlc3VsdCA9IGVsKSwgdHJ1ZSkgOiBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgZmlyc3QgVEQgaW4gYSBwYXRoIGFycmF5XG4gICAgICogQHBhcmFtICB7W2FycmF5XX0gYXJyICBbUGF0aCBhcnJheSBjb250YWluaW5nIGVsZW1lbnRzXVxuICAgICAqIEByZXR1cm4ge1tvYmplY3RdfSAgICAgW0ZvdW5kIGVsZW1lbnRdXG4gICAgICovXG4gICAgZmlyc3RURGluQXJyYXk6IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgdmFyIGNlbGwgPSBIZWxwZXJzLmZpcnN0SW5BcnJheShhcnIsIGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC5ub2RlTmFtZSAmJiBlbGVtZW50Lm5vZGVOYW1lID09PSAnVEQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGNlbGw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHR3byBjZWxsIG9iamVjdHMgcmVmZXJlbmNlIHRoZSBzYW1lIGNlbGxcbiAgICAgKiBAcGFyYW0gIHtbYXJyYXldfSBjZWxsMSBbRmlyc3QgY2VsbF1cbiAgICAgKiBAcGFyYW0gIHtbYXJyYXldfSBjZWxsMiBbU2Vjb25kIGNlbGxdXG4gICAgICogQHJldHVybiB7W2Jvb2xlYW5dfSAgICBbQm9vbGVhbiBpbmRpY2F0aW5nIGlmIHRoZSBjZWxscyBhcmUgZXF1YWxdXG4gICAgICovXG4gICAgZXF1YWxDZWxsczogZnVuY3Rpb24gKGNlbGwxLCBjZWxsMikge1xuICAgICAgICBpZiAoIWNlbGwxIHx8ICFjZWxsMiB8fCBjZWxsMS5sZW5ndGggIT09IGNlbGwyLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNlbGwxWzBdID09PSBjZWxsMlswXSAmJiBjZWxsMVsxXSA9PT0gY2VsbDJbMV0pIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENvdW50cyBpbiBsZXR0ZXJzIChBLCBCLCBDLi4uWiwgQUEpO1xuICAgICAqIEByZXR1cm4ge1tzdHJpbmddfSBbTGV0dGVyXVxuICAgICAqL1xuICAgIGNvdW50V2l0aExldHRlcnM6IGZ1bmN0aW9uIChudW0pIHtcbiAgICAgICAgdmFyIG1vZCA9IG51bSAlIDI2LFxuICAgICAgICAgICAgcG93ID0gbnVtIC8gMjYgfCAwLFxuICAgICAgICAgICAgb3V0ID0gbW9kID8gU3RyaW5nLmZyb21DaGFyQ29kZSg2NCArIG1vZCkgOiAoLS1wb3csICdaJyk7XG4gICAgICAgIHJldHVybiBwb3cgPyB0aGlzLmNvdW50V2l0aExldHRlcnMocG93KSArIG91dCA6IG91dDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHJhbmRvbSA1LWNoYXJhY3RlciBpZFxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gW1NvbWV3aGF0IHJhbmRvbSBpZF1cbiAgICAgKi9cbiAgICBtYWtlU3ByZWFkc2hlZXRJZDogZnVuY3Rpb24oKVxuICAgIHtcbiAgICAgICAgdmFyIHRleHQgPSAnJyxcbiAgICAgICAgICAgIHBvc3NpYmxlID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5JztcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDU7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgdGV4dCArPSBwb3NzaWJsZS5jaGFyQXQoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcG9zc2libGUubGVuZ3RoKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSGVscGVyczsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIENlbGxDb21wb25lbnQgPSByZXF1aXJlKCcuL2NlbGwnKTtcbnZhciBIZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJyk7XG5cbnZhciBSb3dDb21wb25lbnQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgLyoqXG4gICAgICogUmVhY3QgUmVuZGVyIG1ldGhvZFxuICAgICAqIEByZXR1cm4ge1tKU1hdfSBbSlNYIHRvIHJlbmRlcl1cbiAgICAgKi9cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29uZmlnID0gdGhpcy5wcm9wcy5jb25maWcsXG4gICAgICAgICAgICBjZWxscyA9IHRoaXMucHJvcHMuY2VsbHMsXG4gICAgICAgICAgICBjb2x1bW5zID0gW10sXG4gICAgICAgICAgICBrZXksIHVpZCwgc2VsZWN0ZWQsIGNlbGxDbGFzc2VzLCBpO1xuXG4gICAgICAgIGlmICghY29uZmlnLmNvbHVtbnMgfHwgY2VsbHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gY29uc29sZS5lcnJvcignVGFibGUgY2FuXFwndCBiZSBpbml0aWFsaXplZCB3aXRob3V0IHNldCBudW1iZXIgb2YgY29sdW1zbiBhbmQgbm8gZGF0YSEnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjZWxscy5sZW5ndGg7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgLy8gSWYgYSBjZWxsIGlzIHNlbGVjdGVkLCBjaGVjayBpZiBpdCdzIHRoaXMgb25lXG4gICAgICAgICAgICBzZWxlY3RlZCA9IEhlbHBlcnMuZXF1YWxDZWxscyh0aGlzLnByb3BzLnNlbGVjdGVkLCBbdGhpcy5wcm9wcy51aWQsIGldKTtcbiAgICAgICAgICAgIGNlbGxDbGFzc2VzID0gKHRoaXMucHJvcHMuY2VsbENsYXNzZXMgJiYgdGhpcy5wcm9wcy5jZWxsQ2xhc3Nlc1tpXSkgPyB0aGlzLnByb3BzLmNlbGxDbGFzc2VzW2ldIDogJyc7XG5cbiAgICAgICAgICAgIGtleSA9ICdyb3dfJyArIHRoaXMucHJvcHMudWlkICsgJ19jZWxsXycgKyBpO1xuICAgICAgICAgICAgdWlkID0gW3RoaXMucHJvcHMudWlkLCBpXTtcbiAgICAgICAgICAgIGNvbHVtbnMucHVzaCg8Q2VsbENvbXBvbmVudCBrZXk9e2tleX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVpZD17dWlkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2NlbGxzW2ldfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnPXtjb25maWd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjZWxsQ2xhc3Nlcz17Y2VsbENsYXNzZXN9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNlbGxWYWx1ZUNoYW5nZT17dGhpcy5wcm9wcy5vbkNlbGxWYWx1ZUNoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZVNlbGVjdENlbGw9e3RoaXMucHJvcHMuaGFuZGxlU2VsZWN0Q2VsbH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZURvdWJsZUNsaWNrT25DZWxsPXt0aGlzLnByb3BzLmhhbmRsZURvdWJsZUNsaWNrT25DZWxsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlQ2VsbEJsdXI9e3RoaXMucHJvcHMuaGFuZGxlQ2VsbEJsdXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcHJlYWRzaGVldElkPXt0aGlzLnByb3BzLnNwcmVhZHNoZWV0SWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZD17c2VsZWN0ZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0aW5nPXt0aGlzLnByb3BzLmVkaXRpbmd9IC8+XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDx0cj57Y29sdW1uc308L3RyPjtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSb3dDb21wb25lbnQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIFJvd0NvbXBvbmVudCA9IHJlcXVpcmUoJy4vcm93Jyk7XG52YXIgRGlzcGF0Y2hlciA9IHJlcXVpcmUoJy4vZGlzcGF0Y2hlcicpO1xudmFyIEhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKTtcblxudmFyIFNwcmVhZHNoZWV0Q29tcG9uZW50ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgIHNwcmVhZHNoZWV0SWQ6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBSZWFjdCAnZ2V0SW5pdGlhbFN0YXRlJyBtZXRob2RcbiAgICAgKi9cbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaW5pdGlhbERhdGEgPSB0aGlzLnByb3BzLmluaXRpYWxEYXRhIHx8IHt9O1xuXG4gICAgICAgIGlmICghaW5pdGlhbERhdGEucm93cykge1xuICAgICAgICAgICAgaW5pdGlhbERhdGEucm93cyA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucHJvcHMuY29uZmlnLnJvd3M7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgICAgIGluaXRpYWxEYXRhLnJvd3NbaV0gPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBjaSA9IDA7IGNpIDwgdGhpcy5wcm9wcy5jb25maWcuY29sdW1uczsgY2kgPSBjaSArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5pdGlhbERhdGEucm93c1tpXVtjaV0gPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZGF0YTogaW5pdGlhbERhdGEsXG4gICAgICAgICAgICBzZWxlY3RlZDogbnVsbCxcbiAgICAgICAgICAgIGxhc3RCbHVycmVkOiBudWxsLFxuICAgICAgICAgICAgc2VsZWN0ZWRFbGVtZW50OiBudWxsLFxuICAgICAgICAgICAgZWRpdGluZzogZmFsc2VcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVhY3QgJ2NvbXBvbmVudERpZE1vdW50JyBtZXRob2RcbiAgICAgKi9cbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmJpbmRLZXlib2FyZCgpO1xuXG4gICAgICAgICQoJ2JvZHknKS5vbignZm9jdXMnLCAnaW5wdXQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgJCh0aGlzKVxuICAgICAgICAgICAgICAgIC5vbmUoJ21vdXNldXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuc2VsZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5zZWxlY3QoKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlYWN0IFJlbmRlciBtZXRob2RcbiAgICAgKiBAcmV0dXJuIHtbSlNYXX0gW0pTWCB0byByZW5kZXJdXG4gICAgICovXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRhdGEgPSB0aGlzLnN0YXRlLmRhdGEsXG4gICAgICAgICAgICBjb25maWcgPSB0aGlzLnByb3BzLmNvbmZpZyxcbiAgICAgICAgICAgIF9jZWxsQ2xhc3NlcyA9IHRoaXMucHJvcHMuY2VsbENsYXNzZXMsXG4gICAgICAgICAgICByb3dzID0gW10sIGtleSwgaSwgY2VsbENsYXNzZXM7XG5cbiAgICAgICAgdGhpcy5zcHJlYWRzaGVldElkID0gdGhpcy5wcm9wcy5zcHJlYWRzaGVldElkIHx8IEhlbHBlcnMubWFrZVNwcmVhZHNoZWV0SWQoKTtcblxuICAgICAgICAvLyBTYW5pdHkgY2hlY2tzXG4gICAgICAgIGlmICghZGF0YS5yb3dzICYmICFjb25maWcucm93cykge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ1RhYmxlIENvbXBvbmVudDogTnVtYmVyIG9mIGNvbHVtcyBub3QgZGVmaW5lZCBpbiBib3RoIGRhdGEgYW5kIGNvbmZpZyEnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSBSb3dzXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBkYXRhLnJvd3MubGVuZ3RoOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgIGtleSA9ICdyb3dfJyArIGk7XG4gICAgICAgICAgICBjZWxsQ2xhc3NlcyA9IChfY2VsbENsYXNzZXMgJiYgX2NlbGxDbGFzc2VzLnJvd3MgJiYgX2NlbGxDbGFzc2VzLnJvd3NbaV0pID8gX2NlbGxDbGFzc2VzLnJvd3NbaV0gOiBudWxsO1xuXG4gICAgICAgICAgICByb3dzLnB1c2goPFJvd0NvbXBvbmVudCBjZWxscz17ZGF0YS5yb3dzW2ldfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2VsbENsYXNzZXM9e2NlbGxDbGFzc2VzfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdWlkPXtpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtrZXl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maWc9e2NvbmZpZ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkPXt0aGlzLnN0YXRlLnNlbGVjdGVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdGluZz17dGhpcy5zdGF0ZS5lZGl0aW5nfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlU2VsZWN0Q2VsbD17dGhpcy5oYW5kbGVTZWxlY3RDZWxsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlRG91YmxlQ2xpY2tPbkNlbGw9e3RoaXMuaGFuZGxlRG91YmxlQ2xpY2tPbkNlbGx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVDZWxsQmx1cj17dGhpcy5oYW5kbGVDZWxsQmx1cn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2VsbFZhbHVlQ2hhbmdlPXt0aGlzLmhhbmRsZUNlbGxWYWx1ZUNoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwcmVhZHNoZWV0SWQ9e3RoaXMuc3ByZWFkc2hlZXRJZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImNlbGxDb21wb25lbnRcIiAvPik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPHRhYmxlIHRhYkluZGV4PVwiMFwiIGRhdGEtc3ByZWFzaGVldC1pZD17dGhpcy5zcHJlYWRzaGVldElkfT5cbiAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgIHtyb3dzfVxuICAgICAgICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBCaW5kcyB0aGUgdmFyaW91cyBrZXlib2FyZCBldmVudHMgZGlzcGF0Y2hlZCB0byB0YWJsZSBmdW5jdGlvbnNcbiAgICAgKi9cbiAgICBiaW5kS2V5Ym9hcmQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgRGlzcGF0Y2hlci5zZXR1cEtleWJvYXJkU2hvcnRjdXRzKCQoUmVhY3RET00uZmluZERPTU5vZGUodGhpcykpWzBdLCB0aGlzLnNwcmVhZHNoZWV0SWQpO1xuXG4gICAgICAgIERpc3BhdGNoZXIuc3Vic2NyaWJlKCd1cF9rZXl1cCcsIGRhdGEgPT4ge1xuICAgICAgICAgICAgdGhpcy5uYXZpZ2F0ZVRhYmxlKCd1cCcsIGRhdGEpO1xuICAgICAgICB9LCB0aGlzLnNwcmVhZHNoZWV0SWQpO1xuICAgICAgICBEaXNwYXRjaGVyLnN1YnNjcmliZSgnZG93bl9rZXl1cCcsIGRhdGEgPT4ge1xuICAgICAgICAgICAgdGhpcy5uYXZpZ2F0ZVRhYmxlKCdkb3duJywgZGF0YSk7XG4gICAgICAgIH0sIHRoaXMuc3ByZWFkc2hlZXRJZCk7XG4gICAgICAgIERpc3BhdGNoZXIuc3Vic2NyaWJlKCdsZWZ0X2tleXVwJywgZGF0YSA9PiB7XG4gICAgICAgICAgICB0aGlzLm5hdmlnYXRlVGFibGUoJ2xlZnQnLCBkYXRhKTtcbiAgICAgICAgfSwgdGhpcy5zcHJlYWRzaGVldElkKTtcbiAgICAgICAgRGlzcGF0Y2hlci5zdWJzY3JpYmUoJ3JpZ2h0X2tleXVwJywgZGF0YSA9PiB7XG4gICAgICAgICAgICB0aGlzLm5hdmlnYXRlVGFibGUoJ3JpZ2h0JywgZGF0YSk7XG4gICAgICAgIH0sIHRoaXMuc3ByZWFkc2hlZXRJZCk7XG4gICAgICAgIERpc3BhdGNoZXIuc3Vic2NyaWJlKCd0YWJfa2V5dXAnLCBkYXRhID0+IHtcbiAgICAgICAgICAgIHRoaXMubmF2aWdhdGVUYWJsZSgncmlnaHQnLCBkYXRhLCBudWxsLCB0cnVlKTtcbiAgICAgICAgfSwgdGhpcy5zcHJlYWRzaGVldElkKTtcblxuICAgICAgICAvLyBQcmV2ZW50IGJyb3dlcidzIGZyb20ganVtcGluZyB0byBVUkwgYmFyXG4gICAgICAgIERpc3BhdGNoZXIuc3Vic2NyaWJlKCd0YWJfa2V5ZG93bicsIGRhdGEgPT4ge1xuICAgICAgICAgICAgaWYgKCQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkgJiYgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KVswXS50YWdOYW1lID09PSAnSU5QVVQnKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE9oLCBvbGQgSUUsIHlvdSDwn5KpXG4gICAgICAgICAgICAgICAgICAgIGRhdGEucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMuc3ByZWFkc2hlZXRJZCk7XG5cbiAgICAgICAgRGlzcGF0Y2hlci5zdWJzY3JpYmUoJ3JlbW92ZV9rZXlkb3duJywgZGF0YSA9PiB7XG4gICAgICAgICAgICBpZiAoISQoZGF0YS50YXJnZXQpLmlzKCdpbnB1dCwgdGV4dGFyZWEnKSkge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhLnByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBPaCwgb2xkIElFLCB5b3Ug8J+SqVxuICAgICAgICAgICAgICAgICAgICBkYXRhLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzLnNwcmVhZHNoZWV0SWQpO1xuXG4gICAgICAgIERpc3BhdGNoZXIuc3Vic2NyaWJlKCdlbnRlcl9rZXl1cCcsICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLnNlbGVjdGVkRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe2VkaXRpbmc6ICF0aGlzLnN0YXRlLmVkaXRpbmd9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQoUmVhY3RET00uZmluZERPTU5vZGUodGhpcykpLmZpcnN0KCkuZm9jdXMoKTtcbiAgICAgICAgfSwgdGhpcy5zcHJlYWRzaGVldElkKTtcblxuICAgICAgICAvLyBHbyBpbnRvIGVkaXQgbW9kZSB3aGVuIHRoZSB1c2VyIHN0YXJ0cyB0eXBpbmcgb24gYSBmaWVsZFxuICAgICAgICBEaXNwYXRjaGVyLnN1YnNjcmliZSgnbGV0dGVyX2tleWRvd24nLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZWRpdGluZyAmJiB0aGlzLnN0YXRlLnNlbGVjdGVkRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIERpc3BhdGNoZXIucHVibGlzaCgnZWRpdFN0YXJ0ZWQnLCB0aGlzLnN0YXRlLnNlbGVjdGVkRWxlbWVudCwgdGhpcy5zcHJlYWRzaGVldElkKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtlZGl0aW5nOiB0cnVlfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMuc3ByZWFkc2hlZXRJZCk7XG5cbiAgICAgICAgLy8gRGVsZXRlIG9uIGJhY2tzcGFjZSBhbmQgZGVsZXRlXG4gICAgICAgIERpc3BhdGNoZXIuc3Vic2NyaWJlKCdyZW1vdmVfa2V5dXAnLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5zZWxlY3RlZCAmJiAhSGVscGVycy5lcXVhbENlbGxzKHRoaXMuc3RhdGUuc2VsZWN0ZWQsIHRoaXMuc3RhdGUubGFzdEJsdXJyZWQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVDZWxsVmFsdWVDaGFuZ2UodGhpcy5zdGF0ZS5zZWxlY3RlZCwgJycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzLnNwcmVhZHNoZWV0SWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBOYXZpZ2F0ZXMgdGhlIHRhYmxlIGFuZCBtb3ZlcyBzZWxlY3Rpb25cbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IGRpcmVjdGlvbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbRGlyZWN0aW9uICgndXAnIHx8ICdkb3duJyB8fCAnbGVmdCcgfHwgJ3JpZ2h0JyldXG4gICAgICogQHBhcmFtICB7QXJyYXk6IFtudW1iZXI6IHJvdywgbnVtYmVyOiBjZWxsXX0gb3JpZ2luQ2VsbCAgW09yaWdpbiBDZWxsXVxuICAgICAqIEBwYXJhbSAge2Jvb2xlYW59IGluRWRpdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtDdXJyZW50bHkgZWRpdGluZ11cbiAgICAgKi9cbiAgICBuYXZpZ2F0ZVRhYmxlOiBmdW5jdGlvbiAoZGlyZWN0aW9uLCBkYXRhLCBvcmlnaW5DZWxsLCBpbkVkaXQpIHtcbiAgICAgICAgLy8gT25seSB0cmF2ZXJzZSB0aGUgdGFibGUgaWYgdGhlIHVzZXIgaXNuJ3QgZWRpdGluZyBhIGNlbGwsXG4gICAgICAgIC8vIHVubGVzcyBvdmVycmlkZSBpcyBnaXZlblxuICAgICAgICBpZiAoIWluRWRpdCAmJiB0aGlzLnN0YXRlLmVkaXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZSB0aGUgY3VyZW50bHkgYWN0aXZlIGNlbGwgaWYgb25lIGlzbid0IHBhc3NlZFxuICAgICAgICBpZiAoIW9yaWdpbkNlbGwpIHtcbiAgICAgICAgICAgIG9yaWdpbkNlbGwgPSB0aGlzLnN0YXRlLnNlbGVjdGVkRWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZlbnQgZGVmYXVsdFxuICAgICAgICBpZiAoZGF0YS5wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgZGF0YS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gT2gsIG9sZCBJRSwgeW91IPCfkqlcbiAgICAgICAgICAgIGRhdGEucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciAkb3JpZ2luID0gJChvcmlnaW5DZWxsKSxcbiAgICAgICAgICAgIGNlbGxJbmRleCA9ICRvcmlnaW4uaW5kZXgoKSxcbiAgICAgICAgICAgIHRhcmdldDtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAndXAnKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSAkb3JpZ2luLmNsb3Nlc3QoJ3RyJykucHJldigpLmNoaWxkcmVuKCkuZXEoY2VsbEluZGV4KS5maW5kKCdzcGFuJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uID09PSAnZG93bicpIHtcbiAgICAgICAgICAgIHRhcmdldCA9ICRvcmlnaW4uY2xvc2VzdCgndHInKS5uZXh0KCkuY2hpbGRyZW4oKS5lcShjZWxsSW5kZXgpLmZpbmQoJ3NwYW4nKTtcbiAgICAgICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgdGFyZ2V0ID0gJG9yaWdpbi5jbG9zZXN0KCd0ZCcpLnByZXYoKS5maW5kKCdzcGFuJyk7XG4gICAgICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSAkb3JpZ2luLmNsb3Nlc3QoJ3RkJykubmV4dCgpLmZpbmQoJ3NwYW4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0YXJnZXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGFyZ2V0LmNsaWNrKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmV4dGVuZFRhYmxlKGRpcmVjdGlvbiwgb3JpZ2luQ2VsbCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXh0ZW5kcyB0aGUgdGFibGUgd2l0aCBhbiBhZGRpdGlvbmFsIHJvdy9jb2x1bW4sIGlmIHBlcm1pdHRlZCBieSBjb25maWdcbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IGRpcmVjdGlvbiBbRGlyZWN0aW9uICgndXAnIHx8ICdkb3duJyB8fCAnbGVmdCcgfHwgJ3JpZ2h0JyldXG4gICAgICovXG4gICAgZXh0ZW5kVGFibGU6IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcbiAgICAgICAgdmFyIGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnLFxuICAgICAgICAgICAgZGF0YSA9IHRoaXMuc3RhdGUuZGF0YSxcbiAgICAgICAgICAgIG5ld1JvdywgaTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAnZG93bicgJiYgY29uZmlnLmNhbkFkZFJvdykge1xuICAgICAgICAgICAgbmV3Um93ID0gW107XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnN0YXRlLmRhdGEucm93c1swXS5sZW5ndGg7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgICAgIG5ld1Jvd1tpXSA9ICcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkYXRhLnJvd3MucHVzaChuZXdSb3cpO1xuICAgICAgICAgICAgRGlzcGF0Y2hlci5wdWJsaXNoKCdyb3dDcmVhdGVkJywgZGF0YS5yb3dzLmxlbmd0aCwgdGhpcy5zcHJlYWRzaGVldElkKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNldFN0YXRlKHtkYXRhOiBkYXRhfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAncmlnaHQnICYmIGNvbmZpZy5jYW5BZGRDb2x1bW4pIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBkYXRhLnJvd3MubGVuZ3RoOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgICAgICBkYXRhLnJvd3NbaV0ucHVzaCgnJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIERpc3BhdGNoZXIucHVibGlzaCgnY29sdW1uQ3JlYXRlZCcsIGRhdGEucm93c1swXS5sZW5ndGgsIHRoaXMuc3ByZWFkc2hlZXRJZCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zZXRTdGF0ZSh7ZGF0YTogZGF0YX0pO1xuICAgICAgICB9XG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZm9yICdzZWxlY3RDZWxsJywgdXBkYXRpbmcgdGhlIHNlbGVjdGVkIENlbGxcbiAgICAgKiBAcGFyYW0gIHtBcnJheTogW251bWJlcjogcm93LCBudW1iZXI6IGNlbGxdfSBjZWxsIFtTZWxlY3RlZCBDZWxsXVxuICAgICAqIEBwYXJhbSAge29iamVjdH0gY2VsbEVsZW1lbnQgW1NlbGVjdGVkIENlbGwgRWxlbWVudF1cbiAgICAgKi9cbiAgICBoYW5kbGVTZWxlY3RDZWxsOiBmdW5jdGlvbiAoY2VsbCwgY2VsbEVsZW1lbnQpIHtcbiAgICAgICAgRGlzcGF0Y2hlci5wdWJsaXNoKCdjZWxsU2VsZWN0ZWQnLCBjZWxsLCB0aGlzLnNwcmVhZHNoZWV0SWQpO1xuICAgICAgICAkKFJlYWN0RE9NLmZpbmRET01Ob2RlKHRoaXMpKS5maXJzdCgpLmZvY3VzKCk7XG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzZWxlY3RlZDogY2VsbCxcbiAgICAgICAgICAgIHNlbGVjdGVkRWxlbWVudDogY2VsbEVsZW1lbnRcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZvciAnY2VsbFZhbHVlQ2hhbmdlJywgdXBkYXRpbmcgdGhlIGNlbGwgZGF0YVxuICAgICAqIEBwYXJhbSAge0FycmF5OiBbbnVtYmVyOiByb3csIG51bWJlcjogY2VsbF19IGNlbGwgW1NlbGVjdGVkIENlbGxdXG4gICAgICogQHBhcmFtICB7b2JqZWN0fSBuZXdWYWx1ZSAgICAgICAgICAgICAgICAgICAgICAgICBbVmFsdWUgdG8gc2V0XVxuICAgICAqL1xuICAgIGhhbmRsZUNlbGxWYWx1ZUNoYW5nZTogZnVuY3Rpb24gKGNlbGwsIG5ld1ZhbHVlKSB7XG4gICAgICAgIHZhciBkYXRhID0gdGhpcy5zdGF0ZS5kYXRhLFxuICAgICAgICAgICAgcm93ID0gY2VsbFswXSxcbiAgICAgICAgICAgIGNvbHVtbiA9IGNlbGxbMV0sXG4gICAgICAgICAgICBvbGRWYWx1ZSA9IGRhdGEucm93c1tyb3ddW2NvbHVtbl07XG5cbiAgICAgICAgRGlzcGF0Y2hlci5wdWJsaXNoKCdjZWxsVmFsdWVDaGFuZ2VkJywgW2NlbGwsIG5ld1ZhbHVlLCBvbGRWYWx1ZV0sIHRoaXMuc3ByZWFkc2hlZXRJZCk7XG5cbiAgICAgICAgZGF0YS5yb3dzW3Jvd11bY29sdW1uXSA9IG5ld1ZhbHVlO1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcbiAgICAgICAgfSk7XG5cbiAgICAgICAgRGlzcGF0Y2hlci5wdWJsaXNoKCdkYXRhQ2hhbmdlZCcsIGRhdGEsIHRoaXMuc3ByZWFkc2hlZXRJZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIGZvciAnZG91YmxlQ2xpY2tvbkNlbGwnLCBlbmFibGluZyAnZWRpdCcgbW9kZVxuICAgICAqL1xuICAgIGhhbmRsZURvdWJsZUNsaWNrT25DZWxsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZWRpdGluZzogdHJ1ZVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2FsbGJhY2sgZm9yICdjZWxsQmx1cidcbiAgICAgKi9cbiAgICBoYW5kbGVDZWxsQmx1cjogZnVuY3Rpb24gKGNlbGwpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuZWRpdGluZykge1xuICAgICAgICAgICAgRGlzcGF0Y2hlci5wdWJsaXNoKCdlZGl0U3RvcHBlZCcsIHRoaXMuc3RhdGUuc2VsZWN0ZWRFbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZWRpdGluZzogZmFsc2UsXG4gICAgICAgICAgICBsYXN0Qmx1cnJlZDogY2VsbFxuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTcHJlYWRzaGVldENvbXBvbmVudDtcbiIsInZhciBzb2NrZXQgPSBpbygpO1xuLy8ganNcbndpbmRvdy5maWxlVG9SZW5kZXIgPSBcIlwiO1xuXG53aW5kb3cucmVuZGVyRmlsZSA9IGZ1bmN0aW9uKHN0cil7XG4gIC8vIHNlbmQgZGF0YSB0byBzZXJ2ZXIgc29ja2V0IG9uY2UgdGhlIGltYWdlIGlzIGxvYWRlZFxuICBvYmogPSB7XG4gICAgXCJzb2NrZXRJRFwiOnNvY2tldC5pZCxcbiAgICBcImZpbGVuYW1lXCI6c3RyXG4gIH07XG4gIHNvY2tldC5lbWl0KCdyZXF1ZXN0Q29udGVudEJveCcsIEpTT04uc3RyaW5naWZ5KG9iaikpXG4gIC8vIHJlbmRlclxuICB3aW5kb3cuZmlsZVRvUmVuZGVyID0gc3RyO1xuICBSZWFjdERPTS5yZW5kZXIoXG4gICAgPEltYWdlIHNvdXJjZT17c3RyfSAgLz4sXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRlbnQnKVxuICApO1xufTtcbi8vIExvYWQgUmVhY3QgY2xhc3Nlc1xudmFyIEltYWdlID0gcmVxdWlyZSgnLi9JbWFnZScpO1xuXG52YXIgRmlsZVVwbG9hZCA9IHJlcXVpcmUoJy4vRmlsZVVwbG9hZCcpO1xuXG52YXIgU3ByZWFkc2hlZXRDb21wb25lbnQgPSByZXF1aXJlKCcuL1NwcmVhZHNoZWV0L3NwcmVhZHNoZWV0Jyk7XG5cbi8vIERlZmF1bHQgcmVuZGVyaW5nXG5SZWFjdERPTS5yZW5kZXIoXG4gIDxGaWxlVXBsb2FkIC8+LFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29udGVudCcpXG4pO1xuXG4vLyBEaXNwbGF5IGNzdiBmaWxlXG5zb2NrZXQub24oJ2NzdkZpbGVwYXRoJywgZnVuY3Rpb24obXNnKXtcbiAgY29uc29sZS5sb2cobXNnKTtcbiAgcm93cyA9IG1zZy5sZW5ndGggLSAxO1xuICBjb2x1bW5zID0gbXNnWzBdLmxlbmd0aDtcbiAgdmFyIGNvbmZpZyA9IHtcbiAgICAvLyBJbml0aWFsIG51bWJlciBvZiByb3dcbiAgICByb3dzOiByb3dzLFxuICAgIC8vIEluaXRpYWwgbnVtYmVyIG9mIGNvbHVtbnNcbiAgICBjb2x1bW5zOiBjb2x1bW5zLFxuICAgIC8vIFRydWUgaWYgdGhlIGZpcnN0IGNvbHVtbiBpbiBlYWNoIHJvdyBpcyBhIGhlYWRlciAodGgpXG4gICAgaGFzSGVhZENvbHVtbjogZmFsc2UsXG4gICAgLy8gVHJ1ZSBpZiB0aGUgZGF0YSBmb3IgdGhlIGZpcnN0IGNvbHVtbiBpcyBqdXN0IGEgc3RyaW5nLlxuICAgIC8vIFNldCB0byBmYWxzZSBpZiB5b3Ugd2FudCB0byBwYXNzIGN1c3RvbSBET00gZWxlbWVudHMuXG4gICAgaXNIZWFkQ29sdW1uU3RyaW5nOiB0cnVlLFxuICAgIC8vIFRydWUgaWYgdGhlIGZpcnN0IHJvdyBpcyBhIGhlYWRlciAodGgpXG4gICAgaGFzSGVhZFJvdzogZmFsc2UsXG4gICAgLy8gVHJ1ZSBpZiB0aGUgZGF0YSBmb3IgdGhlIGNlbGxzIGluIHRoZSBmaXJzdCByb3cgY29udGFpbnMgc3RyaW5ncy5cbiAgICAvLyBTZXQgdG8gZmFsc2UgaWYgeW91IHdhbnQgdG8gcGFzcyBjdXN0b20gRE9NIGVsZW1lbnRzLlxuICAgIGlzSGVhZFJvd1N0cmluZzogdHJ1ZSxcbiAgICAvLyBUcnVlIGlmIHRoZSB1c2VyIGNhbiBhZGQgcm93cyAoYnkgbmF2aWdhdGluZyBkb3duIGZyb20gdGhlIGxhc3Qgcm93KVxuICAgIGNhbkFkZFJvdzogZmFsc2UsXG4gICAgLy8gVHJ1ZSBpZiB0aGUgdXNlciBjYW4gYWRkIGNvbHVtbnMgKGJ5IG5hdmlnYXRpbmcgcmlnaHQgZnJvbSB0aGUgbGFzdCBjb2x1bW4pXG4gICAgY2FuQWRkQ29sdW1uOiBmYWxzZSxcbiAgICAvLyBPdmVycmlkZSB0aGUgZGlzcGxheSB2YWx1ZSBmb3IgYW4gZW1wdHkgY2VsbFxuICAgIGVtcHR5VmFsdWVTeW1ib2w6ICctJyxcbiAgICAvLyBGaWxscyB0aGUgZmlyc3QgY29sdW1uIHdpdGggaW5kZXggbnVtYmVycyAoMS4uLm4pIGFuZCB0aGUgZmlyc3Qgcm93IHdpdGggaW5kZXggbGV0dGVycyAoQS4uLlpaWilcbiAgICBoYXNMZXR0ZXJOdW1iZXJIZWFkczogdHJ1ZVxuICB9O1xuICBpbml0aWFsRGF0YSA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG1zZy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICBpbml0aWFsRGF0YS5wdXNoKG1zZ1tpXSlcbiAgfVxuICAvLyBzZXQgZGF0YVxuICB2YXIgZGF0YSA9IHtcbiAgICByb3dzOiBpbml0aWFsRGF0YVxuICB9O1xuICAvLyByZW5kZXJcbiAgUmVhY3RET00ucmVuZGVyKFxuICAgPFNwcmVhZHNoZWV0Q29tcG9uZW50IGluaXRpYWxEYXRhPXtkYXRhfSBjb25maWc9e2NvbmZpZ30gc3ByZWFkc2hlZXRJZD1cIjFcIiAvPixcbiAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb250ZW50JylcbiAgKTtcbn0pO1xuXG4vLyBEaXNwbGF5IENvbnRlbnQgYm94ZXNcbnNvY2tldC5vbignY29udGVudEJveCcsIGZ1bmN0aW9uKG1zZyl7XG4gIGNvbnNvbGUubG9nKG1zZyk7XG4gIHZhciBjYW52YXNMYXllciA9ICQoXCIjY2FudmFzTGF5ZXJcIilbMF07XG4gIHZhciBjdHggPSBjYW52YXNMYXllci5nZXRDb250ZXh0KFwiMmRcIik7XG4gIHZhciBkcmF3ID0gZnVuY3Rpb24oKXtcbiAgICBjdHguY2xlYXJSZWN0KDAsMCxjYW52YXNMYXllci53aWR0aCxjYW52YXNMYXllci5oZWlnaHQpO1xuICAgIG1zZ1tcImRhdGFcIl0uZm9yRWFjaChmdW5jdGlvbihlbHQpe1xuICAgICAgdmFyIHRvcCA9IGVsdFtcInBvc1wiXVswXTtcbiAgICAgIHZhciBib3QgPSBlbHRbXCJwb3NcIl1bMV07XG4gICAgICB2YXIgd2lkdGggPSBib3RbXCJ4XCJdIC0gdG9wW1wieFwiXTtcbiAgICAgIHZhciBoZWlnaHQgPSBib3RbXCJ5XCJdIC0gdG9wW1wieVwiXTtcbiAgICAgIGN0eC5saW5lV2lkdGggPSAyO1xuICAgICAgY3R4LnN0cm9rZVJlY3QodG9wW1wieFwiXSwgdG9wW1wieVwiXSwgd2lkdGgsIGhlaWdodClcbiAgICAgIGlmIChlbHRbXCJjbGFzc1wiXVswXSA9PSBcIjAuMFwiKXtcbiAgICAgICAgY3R4LmZpbGxTdHlsZT1cInJnYmEoMjQzLCAyMjgsIDAsIDAuNTUpXCJcbiAgICAgICAgY3R4LmZpbGxSZWN0KHRvcFtcInhcIl0sdG9wW1wieVwiXSxcbiAgICAgICAgYm90W1wieFwiXSAtIHRvcFtcInhcIl0sYm90W1wieVwiXSAtIHRvcFtcInlcIl0pXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgLy8gRHJhdyBib3hlc1xuICBkcmF3KClcbiAgLy8gbGlzdGVuIGZvciBtb3VzZSBwb3NpdGlvbiBhbmQgaGlnaGxpZ2h0IHRoZSBhcmVhXG4gIC8vIGhpZ2h0bGlnaHQgZm9yIGdvb2Qgd2hlbiBjbGlja2VkXG4gICQoXCIjY2FudmFzTGF5ZXJcIikub24oJ21vdXNlbW92ZScsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICBib3VuZCA9IGNhbnZhc0xheWVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgY1ggPSBldmVudC5jbGllbnRYIC0gYm91bmQubGVmdFxuICAgIGNZID0gZXZlbnQuY2xpZW50WSAtIGJvdW5kLnRvcFxuICAgIGRyYXcoKVxuICAgIG1zZ1tcImRhdGFcIl0uZm9yRWFjaChmdW5jdGlvbihlbHQpe1xuICAgICAgdmFyIHRvcCA9IGVsdFtcInBvc1wiXVswXTtcbiAgICAgIHZhciBib3QgPSBlbHRbXCJwb3NcIl1bMV07XG4gICAgICB2YXIgd2lkdGggPSBib3RbXCJ4XCJdIC0gdG9wW1wieFwiXTtcbiAgICAgIHZhciBoZWlnaHQgPSBib3RbXCJ5XCJdIC0gdG9wW1wieVwiXTtcbiAgICAgIGN0eC5saW5lV2lkdGggPSAyO1xuICAgICAgY3R4LnN0cm9rZVJlY3QodG9wW1wieFwiXSwgdG9wW1wieVwiXSwgd2lkdGgsIGhlaWdodClcbiAgICAgIGlmIChjWCA+PSB0b3BbXCJ4XCJdICYmIGNYIDw9IGJvdFtcInhcIl0gJiZcbiAgICAgIGNZID49IHRvcFtcInlcIl0gJiYgY1kgPD0gYm90W1wieVwiXSl7XG4gICAgICAgICAgaWYgKGVsdFtcImNsYXNzXCJdWzBdID09IFwiMS4wXCIpe1xuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZT1cInJnYmEoMjQzLCAyMjgsIDEwMywgMC41NSlcIlxuICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHRvcFtcInhcIl0sdG9wW1wieVwiXSxcbiAgICAgICAgICAgIGJvdFtcInhcIl0gLSB0b3BbXCJ4XCJdLGJvdFtcInlcIl0gLSB0b3BbXCJ5XCJdKVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG4gICQoXCIjY2FudmFzTGF5ZXJcIikub24oJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgIGJvdW5kID0gY2FudmFzTGF5ZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICBjWCA9IGV2ZW50LmNsaWVudFggLSBib3VuZC5sZWZ0XG4gICAgY1kgPSBldmVudC5jbGllbnRZIC0gYm91bmQudG9wXG4gICAgZHJhdygpXG4gICAgbXNnW1wiZGF0YVwiXS5mb3JFYWNoKGZ1bmN0aW9uKGVsdCl7XG4gICAgICB2YXIgdG9wID0gZWx0W1wicG9zXCJdWzBdO1xuICAgICAgdmFyIGJvdCA9IGVsdFtcInBvc1wiXVsxXTtcbiAgICAgIHZhciB3aWR0aCA9IGJvdFtcInhcIl0gLSB0b3BbXCJ4XCJdO1xuICAgICAgdmFyIGhlaWdodCA9IGJvdFtcInlcIl0gLSB0b3BbXCJ5XCJdO1xuICAgICAgY3R4LmxpbmVXaWR0aCA9IDI7XG4gICAgICBjdHguc3Ryb2tlUmVjdCh0b3BbXCJ4XCJdLCB0b3BbXCJ5XCJdLCB3aWR0aCwgaGVpZ2h0KVxuICAgICAgaWYgKGNYID49IHRvcFtcInhcIl0gJiYgY1ggPD0gYm90W1wieFwiXSAmJlxuICAgICAgY1kgPj0gdG9wW1wieVwiXSAmJiBjWSA8PSBib3RbXCJ5XCJdKXtcbiAgICAgICAgICBpZiAoZWx0W1wiY2xhc3NcIl1bMF0gPT0gXCIxLjBcIil7XG4gICAgICAgICAgICBlbHRbXCJjbGFzc1wiXVswXSA9IFwiMC4wXCJcbiAgICAgICAgICAgIGVsdFtcImNsYXNzXCJdWzFdID0gXCIxLjBcIlxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZT1cInJnYmEoMjQzLCAyMjgsIDAsIDAuNTUpXCJcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdCh0b3BbXCJ4XCJdLHRvcFtcInlcIl0sXG4gICAgICAgICAgICBib3RbXCJ4XCJdIC0gdG9wW1wieFwiXSxib3RbXCJ5XCJdIC0gdG9wW1wieVwiXSlcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoZWx0W1wiY2xhc3NcIl1bMF0gPT0gXCIwLjBcIikge1xuICAgICAgICAgICAgZWx0W1wiY2xhc3NcIl1bMF0gPSBcIjEuMFwiXG4gICAgICAgICAgICBlbHRbXCJjbGFzc1wiXVsxXSA9IFwiMC4wXCJcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuICAvLyBPbiBjbGljayBvbiB2YWxpZGF0ZSA6IGVtaXQgZXZlbnQgdG8gbm9kZWpzIHNlcnZlclxuICAkKFwiI3ZhbGlkYXRlXCIpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oKXtcbiAgICAkKFwiI3ZhbGlkYXRlXCIpWzBdLmNsYXNzTmFtZT1cImJ1dHRvbiBob2xsb3cgZGlzYWJsZWRcIjtcbiAgICBvYmogPSB7XG4gICAgICBcInNvY2tldElEXCI6c29ja2V0LmlkLFxuICAgICAgXCJmaWxlbmFtZVwiOndpbmRvdy5maWxlVG9SZW5kZXIsXG4gICAgICBcImNvbnRlbnRCb3hlc1wiOm1zZ1xuICAgIH07XG4gICAgc29ja2V0LmVtaXQoJ3JlcXVlc3RDc3YnLCBKU09OLnN0cmluZ2lmeShvYmopKTtcbiAgICAvLyByZW1vdmUgbW91c2Vtb3ZlIGFuZCBjbGljayBldmVudFxuICAgICQoXCIjY2FudmFzTGFlclwiKS5vZmYoKVxuICAgICQoXCIjdmFsaWRhdGVcIikub2ZmKClcbiAgfSk7XG59KTtcbiJdfQ==
