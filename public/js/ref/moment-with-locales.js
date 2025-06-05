;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            global.moment = factory()
}(this, (function () { 'use strict';

    var hookCallback;

    function hooks() {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback(callback) {
        hookCallback = callback;
    }

    function isArray(input) {
        return (
            input instanceof Array ||
            Object.prototype.toString.call(input) === '[object Array]'
        );
    }

    function isObject(input) {
        // IE8 will treat undefined and null as object if it wasn't for
        // input != null
        return (
            input != null &&
            Object.prototype.toString.call(input) === '[object Object]'
        );
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function isObjectEmpty(obj) {
        if (Object.getOwnPropertyNames) {
            return Object.getOwnPropertyNames(obj).length === 0;
        } else {
            var k;
            for (k in obj) {
                if (hasOwnProp(obj, k)) {
                    return false;
                }
            }
            return true;
        }
    }

    function isUndefined(input) {
        return input === void 0;
    }

    function isNumber(input) {
        return (
            typeof input === 'number' ||
            Object.prototype.toString.call(input) === '[object Number]'
        );
    }

    function isDate(input) {
        return (
            input instanceof Date ||
            Object.prototype.toString.call(input) === '[object Date]'
        );
    }

    function map(arr, fn) {
        var res = [],
            i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function createUTC(input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty: false,
            unusedTokens: [],
            unusedInput: [],
            overflow: -2,
            charsLeftOver: 0,
            nullInput: false,
            invalidEra: null,
            invalidMonth: null,
            invalidFormat: false,
            userInvalidated: false,
            iso: false,
            parsedDateParts: [],
            era: null,
            meridiem: null,
            rfc2822: false,
            weekdayMismatch: false,
        };
    }

    function getParsingFlags(m) {
        if (m._pf == null) {
            m._pf = defaultParsingFlags();
        }
        return m._pf;
    }

    var some;
    if (Array.prototype.some) {
        some = Array.prototype.some;
    } else {
        some = function (fun) {
            var t = Object(this),
                len = t.length >>> 0,
                i;

            for (i = 0; i < len; i++) {
                if (i in t && fun.call(this, t[i], i, t)) {
                    return true;
                }
            }

            return false;
        };
    }

    function isValid(m) {
        if (m._isValid == null) {
            var flags = getParsingFlags(m),
                parsedParts = some.call(flags.parsedDateParts, function (i) {
                    return i != null;
                }),
                isNowValid =
                    !isNaN(m._d.getTime()) &&
                    flags.overflow < 0 &&
                    !flags.empty &&
                    !flags.invalidEra &&
                    !flags.invalidMonth &&
                    !flags.invalidWeekday &&
                    !flags.weekdayMismatch &&
                    !flags.nullInput &&
                    !flags.invalidFormat &&
                    !flags.userInvalidated &&
                    (!flags.meridiem || (flags.meridiem && parsedParts));

            if (m._strict) {
                isNowValid =
                    isNowValid &&
                    flags.charsLeftOver === 0 &&
                    flags.unusedTokens.length === 0 &&
                    flags.bigHour === undefined;
            }

            if (Object.isFrozen == null || !Object.isFrozen(m)) {
                m._isValid = isNowValid;
            } else {
                return isNowValid;
            }
        }
        return m._isValid;
    }

    function createInvalid(flags) {
        var m = createUTC(NaN);
        if (flags != null) {
            extend(getParsingFlags(m), flags);
        } else {
            getParsingFlags(m).userInvalidated = true;
        }

        return m;
    }

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    var momentProperties = (hooks.momentProperties = []),
        updateInProgress = false;

    function copyConfig(to, from) {
        var i, prop, val;

        if (!isUndefined(from._isAMomentObject)) {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (!isUndefined(from._i)) {
            to._i = from._i;
        }
        if (!isUndefined(from._f)) {
            to._f = from._f;
        }
        if (!isUndefined(from._l)) {
            to._l = from._l;
        }
        if (!isUndefined(from._strict)) {
            to._strict = from._strict;
        }
        if (!isUndefined(from._tzm)) {
            to._tzm = from._tzm;
        }
        if (!isUndefined(from._isUTC)) {
            to._isUTC = from._isUTC;
        }
        if (!isUndefined(from._offset)) {
            to._offset = from._offset;
        }
        if (!isUndefined(from._pf)) {
            to._pf = getParsingFlags(from);
        }
        if (!isUndefined(from._locale)) {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i = 0; i < momentProperties.length; i++) {
                prop = momentProperties[i];
                val = from[prop];
                if (!isUndefined(val)) {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
        if (!this.isValid()) {
            this._d = new Date(NaN);
        }
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment(obj) {
        return (
            obj instanceof Moment || (obj != null && obj._isAMomentObject != null)
        );
    }

    function warn(msg) {
        if (
            hooks.suppressDeprecationWarnings === false &&
            typeof console !== 'undefined' &&
            console.warn
        ) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;

        return extend(function () {
            if (hooks.deprecationHandler != null) {
                hooks.deprecationHandler(null, msg);
            }
            if (firstTime) {
                var args = [],
                    arg,
                    i,
                    key;
                for (i = 0; i < arguments.length; i++) {
                    arg = '';
                    if (typeof arguments[i] === 'object') {
                        arg += '\n[' + i + '] ';
                        for (key in arguments[0]) {
                            if (hasOwnProp(arguments[0], key)) {
                                arg += key + ': ' + arguments[0][key] + ', ';
                            }
                        }
                        arg = arg.slice(0, -2); // Remove trailing comma and space
                    } else {
                        arg = arguments[i];
                    }
                    args.push(arg);
                }
                warn(
                    msg +
                    '\nArguments: ' +
                    Array.prototype.slice.call(args).join('') +
                    '\n' +
                    new Error().stack
                );
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (hooks.deprecationHandler != null) {
            hooks.deprecationHandler(name, msg);
        }
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    hooks.suppressDeprecationWarnings = false;
    hooks.deprecationHandler = null;

    function isFunction(input) {
        return (
            (typeof Function !== 'undefined' && input instanceof Function) ||
            Object.prototype.toString.call(input) === '[object Function]'
        );
    }

    function set(config) {
        var prop, i;
        for (i in config) {
            if (hasOwnProp(config, i)) {
                prop = config[i];
                if (isFunction(prop)) {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        }
        this._config = config;
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
        // TODO: Remove "ordinalParse" fallback in next major release.
        this._dayOfMonthOrdinalParseLenient = new RegExp(
            (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
            '|' +
            /\d{1,2}/.source
        );
    }

    function mergeConfigs(parentConfig, childConfig) {
        var res = extend({}, parentConfig),
            prop;
        for (prop in childConfig) {
            if (hasOwnProp(childConfig, prop)) {
                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                    res[prop] = {};
                    extend(res[prop], parentConfig[prop]);
                    extend(res[prop], childConfig[prop]);
                } else if (childConfig[prop] != null) {
                    res[prop] = childConfig[prop];
                } else {
                    delete res[prop];
                }
            }
        }
        for (prop in parentConfig) {
            if (
                hasOwnProp(parentConfig, prop) &&
                !hasOwnProp(childConfig, prop) &&
                isObject(parentConfig[prop])
            ) {
                // make sure changes to properties don't modify parent config
                res[prop] = extend({}, res[prop]);
            }
        }
        return res;
    }

    function Locale(config) {
        if (config != null) {
            this.set(config);
        }
    }

    var keys;

    if (Object.keys) {
        keys = Object.keys;
    } else {
        keys = function (obj) {
            var i,
                res = [];
            for (i in obj) {
                if (hasOwnProp(obj, i)) {
                    res.push(i);
                }
            }
            return res;
        };
    }

    var defaultCalendar = {
        sameDay: '[Today at] LT',
        nextDay: '[Tomorrow at] LT',
        nextWeek: 'dddd [at] LT',
        lastDay: '[Yesterday at] LT',
        lastWeek: '[Last] dddd [at] LT',
        sameElse: 'L',
    };

    function calendar(key, mom, now) {
        var output = this._calendar[key] || this._calendar['sameElse'];
        return isFunction(output) ? output.call(mom, now) : output;
    }

    function zeroFill(number, targetLength, forceSign) {
        var absNumber = '' + Math.abs(number),
            zerosToFill = targetLength - absNumber.length,
            sign = number >= 0;
        return (
            (sign ? (forceSign ? '+' : '') : '-') +
            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) +
            absNumber
        );
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|N{1,5}|YYYYYY|YYYYY|YYYY|YY|y{2,4}|yo?|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,
        formatFunctions = {},
        formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken(token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(
                    func.apply(this, arguments),
                    token
                );
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens),
            i,
            length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '',
                i;
            for (i = 0; i < length; i++) {
                output += isFunction(array[i])
                    ? array[i].call(mom, format)
                    : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());
        formatFunctions[format] =
            formatFunctions[format] || makeFormatFunction(format);

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(
                localFormattingTokens,
                replaceLongDateFormatTokens
            );
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var defaultLongDateFormat = {
        LTS: 'h:mm:ss A',
        LT: 'h:mm A',
        L: 'MM/DD/YYYY',
        LL: 'MMMM D, YYYY',
        LLL: 'MMMM D, YYYY h:mm A',
        LLLL: 'dddd, MMMM D, YYYY h:mm A',
    };

    function longDateFormat(key) {
        var format = this._longDateFormat[key],
            formatUpper = this._longDateFormat[key.toUpperCase()];

        if (format || !formatUpper) {
            return format;
        }

        this._longDateFormat[key] = formatUpper
            .match(formattingTokens)
            .map(function (tok) {
                if (
                    tok === 'MMMM' ||
                    tok === 'MM' ||
                    tok === 'DD' ||
                    tok === 'dddd'
                ) {
                    return tok.slice(1);
                }
                return tok;
            })
            .join('');

        return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate() {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d',
        defaultDayOfMonthOrdinalParse = /\d{1,2}/;

    function ordinal(number) {
        return this._ordinal.replace('%d', number);
    }

    var defaultRelativeTime = {
        future: 'in %s',
        past: '%s ago',
        s: 'a few seconds',
        ss: '%d seconds',
        m: 'a minute',
        mm: '%d minutes',
        h: 'an hour',
        hh: '%d hours',
        d: 'a day',
        dd: '%d days',
        w: 'a week',
        ww: '%d weeks',
        M: 'a month',
        MM: '%d months',
        y: 'a year',
        yy: '%d years',
    };

    function relativeTime(number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return isFunction(output)
            ? output(number, withoutSuffix, string, isFuture)
            : output.replace(/%d/i, number);
    }

    function pastFuture(diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
    }

    var aliases = {};

    function addUnitAlias(unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string'
            ? aliases[units] || aliases[units.toLowerCase()]
            : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    var priorities = {};

    function addUnitPriority(unit, priority) {
        priorities[unit] = priority;
    }

    function getPrioritizedUnits(unitsObj) {
        var units = [],
            u;
        for (u in unitsObj) {
            if (hasOwnProp(unitsObj, u)) {
                units.push({ unit: u, priority: priorities[u] });
            }
        }
        units.sort(function (a, b) {
            return a.priority - b.priority;
        });
        return units;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function absFloor(number) {
        if (number < 0) {
            // -0 -> 0
            return Math.ceil(number) || 0;
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    function makeGetSet(unit, keepTime) {
        return function (value) {
            if (value != null) {
                set$1(this, unit, value);
                hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get(this, unit);
            }
        };
    }

    function get(mom, unit) {
        return mom.isValid()
            ? mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]()
            : NaN;
    }

    function set$1(mom, unit, value) {
        if (mom.isValid() && !isNaN(value)) {
            if (
                unit === 'FullYear' &&
                isLeapYear(mom.year()) &&
                mom.month() === 1 &&
                mom.date() === 29
            ) {
                value = toInt(value);
                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](
                    value,
                    mom.month(),
                    daysInMonth(value, mom.month())
                );
            } else {
                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
            }
        }
    }

    // MOMENTS

    function stringGet(units) {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units]();
        }
        return this;
    }

    function stringSet(units, value) {
        if (typeof units === 'object') {
            units = normalizeObjectUnits(units);
            var prioritized = getPrioritizedUnits(units),
                i;
            for (i = 0; i < prioritized.length; i++) {
                this[prioritized[i].unit](units[prioritized[i].unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (isFunction(this[units])) {
                return this[units](value);
            }
        }
        return this;
    }

    var match1 = /\d/, //       0 - 9
        match2 = /\d\d/, //      00 - 99
        match3 = /\d{3}/, //     000 - 999
        match4 = /\d{4}/, //    0000 - 9999
        match6 = /[+-]?\d{6}/, // -999999 - 999999
        match1to2 = /\d\d?/, //       0 - 99
        match3to4 = /\d\d\d\d?/, //     999 - 9999
        match5to6 = /\d\d\d\d\d\d?/, //   99999 - 999999
        match1to3 = /\d{1,3}/, //       0 - 999
        match1to4 = /\d{1,4}/, //       0 - 9999
        match1to6 = /[+-]?\d{1,6}/, // -999999 - 999999
        matchUnsigned = /\d+/, //       0 - inf
        matchSigned = /[+-]?\d+/, //    -inf - inf
        matchOffset = /Z|[+-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi, // +00 -00 +00:00 -00:00 +0000 -0000 or Z
        matchTimestamp = /[+-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
        // any word (or two) characters or numbers including two/three word month in arabic.
        // includes scottish gaelic two word and hyphenated months
        matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i,
        regexes;

    regexes = {};

    function addRegexToken(token, regex, strictRegex) {
        regexes[token] = isFunction(regex)
            ? regex
            : function (isStrict, localeData) {
                return isStrict && strictRegex ? strictRegex : regex;
            };
    }

    function getParseRegexForToken(token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return regexEscape(
            s
                .replace('\\', '')
                .replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (
                    matched,
                    p1,
                    p2,
                    p3,
                    p4
                ) {
                    return p1 || p2 || p3 || p4;
                })
        );
    }

    function regexEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken(token, callback) {
        var i,
            func = callback;
        if (typeof token === 'string') {
            token = [token];
        }
        if (isNumber(callback)) {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        for (i = 0; i < token.length; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken(token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,
        WEEK = 7,
        WEEKDAY = 8;

    function mod(n, x) {
        return ((n % x) + x) % x;
    }

    var indexOf;

    if (Array.prototype.indexOf) {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function (o) {
            // I know
            var i;
            for (i = 0; i < this.length; ++i) {
                if (this[i] === o) {
                    return i;
                }
            }
            return -1;
        };
    }

    function daysInMonth(year, month) {
        if (isNaN(year) || isNaN(month)) {
            return NaN;
        }
        var modMonth = mod(month, 12);
        year += (month - modMonth) / 12;
        return modMonth === 1
            ? isLeapYear(year)
                ? 29
                : 28
            : 31 - ((modMonth % 7) % 2);
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PRIORITY

    addUnitPriority('month', 8);

    // PARSING

    addRegexToken('M', match1to2);
    addRegexToken('MM', match1to2, match2);
    addRegexToken('MMM', function (isStrict, locale) {
        return locale.monthsShortRegex(isStrict);
    });
    addRegexToken('MMMM', function (isStrict, locale) {
        return locale.monthsRegex(isStrict);
    });

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            getParsingFlags(config).invalidMonth = input;
        }
    });

    // LOCALES

    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
            '_'
        ),
        defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split(
            '_'
        ),
        MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,
        defaultMonthsShortRegex = matchWord,
        defaultMonthsRegex = matchWord;

    function localeMonths(m, format) {
        if (!m) {
            return isArray(this._months)
                ? this._months
                : this._months['standalone'];
        }
        return isArray(this._months)
            ? this._months[m.month()]
            : this._months[
                (this._months.isFormat || MONTHS_IN_FORMAT).test(format)
                    ? 'format'
                    : 'standalone'
                ][m.month()];
    }

    function localeMonthsShort(m, format) {
        if (!m) {
            return isArray(this._monthsShort)
                ? this._monthsShort
                : this._monthsShort['standalone'];
        }
        return isArray(this._monthsShort)
            ? this._monthsShort[m.month()]
            : this._monthsShort[
                MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'
                ][m.month()];
    }

    function handleStrictParse(monthName, format, strict) {
        var i,
            ii,
            mom,
            llc = monthName.toLocaleLowerCase();
        if (!this._monthsParse) {
            // this is not used
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
            for (i = 0; i < 12; ++i) {
                mom = createUTC([2000, i]);
                this._shortMonthsParse[i] = this.monthsShort(
                    mom,
                    ''
                ).toLocaleLowerCase();
                this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeMonthsParse(monthName, format, strict) {
        var i, mom, regex;

        if (this._monthsParseExact) {
            return handleStrictParse.call(this, monthName, format, strict);
        }

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        // TODO: add sorting
        // Sorting makes sure if one month (or abbr) is a prefix of another
        // see sorting in computeMonthsParse
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp(
                    '^' + this.months(mom, '').replace('.', '') + '$',
                    'i'
                );
                this._shortMonthsParse[i] = new RegExp(
                    '^' + this.monthsShort(mom, '').replace('.', '') + '$',
                    'i'
                );
            }
            if (!strict && !this._monthsParse[i]) {
                regex =
                    '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (
                strict &&
                format === 'MMMM' &&
                this._longMonthsParse[i].test(monthName)
            ) {
                return i;
            } else if (
                strict &&
                format === 'MMM' &&
                this._shortMonthsParse[i].test(monthName)
            ) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth(mom, value) {
        var dayOfMonth;

        if (!mom.isValid()) {
            // No op
            return mom;
        }

        if (typeof value === 'string') {
            if (/^\d+$/.test(value)) {
                value = toInt(value);
            } else {
                value = mom.localeData().monthsParse(value);
                // TODO: Another silent failure?
                if (!isNumber(value)) {
                    return mom;
                }
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth(value) {
        if (value != null) {
            setMonth(this, value);
            hooks.updateOffset(this, true);
            return this;
        } else {
            return get(this, 'Month');
        }
    }

    function getDaysInMonth() {
        return daysInMonth(this.year(), this.month());
    }

    function monthsShortRegex(isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsShortStrictRegex;
            } else {
                return this._monthsShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsShortRegex')) {
                this._monthsShortRegex = defaultMonthsShortRegex;
            }
            return this._monthsShortStrictRegex && isStrict
                ? this._monthsShortStrictRegex
                : this._monthsShortRegex;
        }
    }

    function monthsRegex(isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsStrictRegex;
            } else {
                return this._monthsRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsRegex')) {
                this._monthsRegex = defaultMonthsRegex;
            }
            return this._monthsStrictRegex && isStrict
                ? this._monthsStrictRegex
                : this._monthsRegex;
        }
    }

    function computeMonthsParse() {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var shortPieces = [],
            longPieces = [],
            mixedPieces = [],
            i,
            mom;
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, i]);
            shortPieces.push(this.monthsShort(mom, ''));
            longPieces.push(this.months(mom, ''));
            mixedPieces.push(this.months(mom, ''));
            mixedPieces.push(this.monthsShort(mom, ''));
        }
        // Sorting makes sure if one month (or abbr) is a prefix of another it
        // will match the longer piece.
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 12; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
        }
        for (i = 0; i < 24; i++) {
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._monthsShortRegex = this._monthsRegex;
        this._monthsStrictRegex = new RegExp(
            '^(' + longPieces.join('|') + ')',
            'i'
        );
        this._monthsShortStrictRegex = new RegExp(
            '^(' + shortPieces.join('|') + ')',
            'i'
        );
    }

    // FORMATTING

    addFormatToken('Y', 0, 0, function () {
        var y = this.year();
        return y <= 9999 ? zeroFill(y, 4) : '+' + y;
    });

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY', 4], 0, 'year');
    addFormatToken(0, ['YYYYY', 5], 0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PRIORITIES

    addUnitPriority('year', 1);

    // PARSING

    addRegexToken('Y', matchSigned);
    addRegexToken('YY', match1to2, match2);
    addRegexToken('YYYY', match1to4, match4);
    addRegexToken('YYYYY', match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
        array[YEAR] =
            input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
        array[YEAR] = hooks.parseTwoDigitYear(input);
    });
    addParseToken('Y', function (input, array) {
        array[YEAR] = parseInt(input, 10);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    // HOOKS

    hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', true);

    function getIsLeapYear() {
        return isLeapYear(this.year());
    }

    function createDate(y, m, d, h, M, s, ms) {
        // can't just apply() to create a date:
        // https://stackoverflow.com/q/181348
        var date;
        // the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            date = new Date(y + 400, m, d, h, M, s, ms);
            if (isFinite(date.getFullYear())) {
                date.setFullYear(y);
            }
        } else {
            date = new Date(y, m, d, h, M, s, ms);
        }

        return date;
    }

    function createUTCDate(y) {
        var date, args;
        // the Date.UTC function remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            args = Array.prototype.slice.call(arguments);
            // preserve leap years using a full 400 year cycle, then reset
            args[0] = y + 400;
            date = new Date(Date.UTC.apply(null, args));
            if (isFinite(date.getUTCFullYear())) {
                date.setUTCFullYear(y);
            }
        } else {
            date = new Date(Date.UTC.apply(null, arguments));
        }

        return date;
    }

    // start-of-first-week - start-of-year
    function firstWeekOffset(year, dow, doy) {
        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
            fwd = 7 + dow - doy,
            // first-week day local weekday -- which local weekday is fwd
            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

        return -fwdlw + fwd - 1;
    }

    // https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
        var localWeekday = (7 + weekday - dow) % 7,
            weekOffset = firstWeekOffset(year, dow, doy),
            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
            resYear,
            resDayOfYear;

        if (dayOfYear <= 0) {
            resYear = year - 1;
            resDayOfYear = daysInYear(resYear) + dayOfYear;
        } else if (dayOfYear > daysInYear(year)) {
            resYear = year + 1;
            resDayOfYear = dayOfYear - daysInYear(year);
        } else {
            resYear = year;
            resDayOfYear = dayOfYear;
        }

        return {
            year: resYear,
            dayOfYear: resDayOfYear,
        };
    }

    function weekOfYear(mom, dow, doy) {
        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
            resWeek,
            resYear;

        if (week < 1) {
            resYear = mom.year() - 1;
            resWeek = week + weeksInYear(resYear, dow, doy);
        } else if (week > weeksInYear(mom.year(), dow, doy)) {
            resWeek = week - weeksInYear(mom.year(), dow, doy);
            resYear = mom.year() + 1;
        } else {
            resYear = mom.year();
            resWeek = week;
        }

        return {
            week: resWeek,
            year: resYear,
        };
    }

    function weeksInYear(year, dow, doy) {
        var weekOffset = firstWeekOffset(year, dow, doy),
            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    }

    // FORMATTING

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PRIORITIES

    addUnitPriority('week', 5);
    addUnitPriority('isoWeek', 5);

    // PARSING

    addRegexToken('w', match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W', match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (
        input,
        week,
        config,
        token
    ) {
        week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // LOCALES

    function localeWeek(mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow: 0, // Sunday is the first day of the week.
        doy: 6, // The week that contains Jan 6th is the first week of the year.
    };

    function localeFirstDayOfWeek() {
        return this._week.dow;
    }

    function localeFirstDayOfYear() {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek(input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek(input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    // FORMATTING

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PRIORITY
    addUnitPriority('day', 11);
    addUnitPriority('weekday', 11);
    addUnitPriority('isoWeekday', 11);

    // PARSING

    addRegexToken('d', match1to2);
    addRegexToken('e', match1to2);
    addRegexToken('E', match1to2);
    addRegexToken('dd', function (isStrict, locale) {
        return locale.weekdaysMinRegex(isStrict);
    });
    addRegexToken('ddd', function (isStrict, locale) {
        return locale.weekdaysShortRegex(isStrict);
    });
    addRegexToken('dddd', function (isStrict, locale) {
        return locale.weekdaysRegex(isStrict);
    });

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
        var weekday = config._locale.weekdaysParse(input, token, config._strict);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            getParsingFlags(config).invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input !== 'string') {
            return input;
        }

        if (!isNaN(input)) {
            return parseInt(input, 10);
        }

        input = locale.weekdaysParse(input);
        if (typeof input === 'number') {
            return input;
        }

        return null;
    }

    function parseIsoWeekday(input, locale) {
        if (typeof input === 'string') {
            return locale.weekdaysParse(input) % 7 || 7;
        }
        return isNaN(input) ? null : input;
    }

    // LOCALES
    function shiftWeekdays(ws, n) {
        return ws.slice(n, 7).concat(ws.slice(0, n));
    }

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
            '_'
        ),
        defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        defaultWeekdaysRegex = matchWord,
        defaultWeekdaysShortRegex = matchWord,
        defaultWeekdaysMinRegex = matchWord;

    function localeWeekdays(m, format) {
        var weekdays = isArray(this._weekdays)
            ? this._weekdays
            : this._weekdays[
                m && m !== true && this._weekdays.isFormat.test(format)
                    ? 'format'
                    : 'standalone'
                ];
        return m === true
            ? shiftWeekdays(weekdays, this._week.dow)
            : m
                ? weekdays[m.day()]
                : weekdays;
    }

    function localeWeekdaysShort(m) {
        return m === true
            ? shiftWeekdays(this._weekdaysShort, this._week.dow)
            : m
                ? this._weekdaysShort[m.day()]
                : this._weekdaysShort;
    }

    function localeWeekdaysMin(m) {
        return m === true
            ? shiftWeekdays(this._weekdaysMin, this._week.dow)
            : m
                ? this._weekdaysMin[m.day()]
                : this._weekdaysMin;
    }

    function handleStrictParse$1(weekdayName, format, strict) {
        var i,
            ii,
            mom,
            llc = weekdayName.toLocaleLowerCase();
        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._minWeekdaysParse = [];

            for (i = 0; i < 7; ++i) {
                mom = createUTC([2000, 1]).day(i);
                this._minWeekdaysParse[i] = this.weekdaysMin(
                    mom,
                    ''
                ).toLocaleLowerCase();
                this._shortWeekdaysParse[i] = this.weekdaysShort(
                    mom,
                    ''
                ).toLocaleLowerCase();
                this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeWeekdaysParse(weekdayName, format, strict) {
        var i, mom, regex;

        if (this._weekdaysParseExact) {
            return handleStrictParse$1.call(this, weekdayName, format, strict);
        }

        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._minWeekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._fullWeekdaysParse = [];
        }

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already

            mom = createUTC([2000, 1]).day(i);
            if (strict && !this._fullWeekdaysParse[i]) {
                this._fullWeekdaysParse[i] = new RegExp(
                    '^' + this.weekdays(mom, '').replace('.', '\\.?') + '$',
                    'i'
                );
                this._shortWeekdaysParse[i] = new RegExp(
                    '^' + this.weekdaysShort(mom, '').replace('.', '\\.?') + '$',
                    'i'
                );
                this._minWeekdaysParse[i] = new RegExp(
                    '^' + this.weekdaysMin(mom, '').replace('.', '\\.?') + '$',
                    'i'
                );
            }
            if (!this._weekdaysParse[i]) {
                regex =
                    '^' +
                    this.weekdays(mom, '') +
                    '|^' +
                    this.weekdaysShort(mom, '') +
                    '|^' +
                    this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (
                strict &&
                format === 'dddd' &&
                this._fullWeekdaysParse[i].test(weekdayName)
            ) {
                return i;
            } else if (
                strict &&
                format === 'ddd' &&
                this._shortWeekdaysParse[i].test(weekdayName)
            ) {
                return i;
            } else if (
                strict &&
                format === 'dd' &&
                this._minWeekdaysParse[i].test(weekdayName)
            ) {
                return i;
            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek(input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek(input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek(input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }

        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.

        if (input != null) {
            var weekday = parseIsoWeekday(input, this.localeData());
            return this.day(this.day() % 7 ? weekday : weekday - 7);
        } else {
            return this.day() || 7;
        }
    }

    function weekdaysRegex(isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysStrictRegex;
            } else {
                return this._weekdaysRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                this._weekdaysRegex = defaultWeekdaysRegex;
            }
            return this._weekdaysStrictRegex && isStrict
                ? this._weekdaysStrictRegex
                : this._weekdaysRegex;
        }
    }

    function weekdaysShortRegex(isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysShortStrictRegex;
            } else {
                return this._weekdaysShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysShortRegex')) {
                this._weekdaysShortRegex = defaultWeekdaysShortRegex;
            }
            return this._weekdaysShortStrictRegex && isStrict
                ? this._weekdaysShortStrictRegex
                : this._weekdaysShortRegex;
        }
    }

    function weekdaysMinRegex(isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysMinStrictRegex;
            } else {
                return this._weekdaysMinRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysMinRegex')) {
                this._weekdaysMinRegex = defaultWeekdaysMinRegex;
            }
            return this._weekdaysMinStrictRegex && isStrict
                ? this._weekdaysMinStrictRegex
                : this._weekdaysMinRegex;
        }
    }

    function computeWeekdaysParse() {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var minPieces = [],
            shortPieces = [],
            longPieces = [],
            mixedPieces = [],
            i,
            mom,
            minp,
            shortp,
            longp;
        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, 1]).day(i);
            minp = regexEscape(this.weekdaysMin(mom, ''));
            shortp = regexEscape(this.weekdaysShort(mom, ''));
            longp = regexEscape(this.weekdays(mom, ''));
            minPieces.push(minp);
            shortPieces.push(shortp);
            longPieces.push(longp);
            mixedPieces.push(minp);
            mixedPieces.push(shortp);
            mixedPieces.push(longp);
        }
        // Sorting makes sure if one weekday (or abbr) is a prefix of another it
        // will match the longer piece.
        minPieces.sort(cmpLenRev);
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);

        this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._weekdaysShortRegex = this._weekdaysRegex;
        this._weekdaysMinRegex = this._weekdaysRegex;

        this._weekdaysStrictRegex = new RegExp(
            '^(' + longPieces.join('|') + ')',
            'i'
        );
        this._weekdaysShortStrictRegex = new RegExp(
            '^(' + shortPieces.join('|') + ')',
            'i'
        );
        this._weekdaysMinStrictRegex = new RegExp(
            '^(' + minPieces.join('|') + ')',
            'i'
        );
    }

    // FORMATTING

    function hFormat() {
        return this.hours() % 12 || 12;
    }

    function kFormat() {
        return this.hours() || 24;
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, hFormat);
    addFormatToken('k', ['kk', 2], 0, kFormat);

    addFormatToken('hmm', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    });

    addFormatToken('hmmss', 0, 0, function () {
        return (
            '' +
            hFormat.apply(this) +
            zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2)
        );
    });

    addFormatToken('Hmm', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2);
    });

    addFormatToken('Hmmss', 0, 0, function () {
        return (
            '' +
            this.hours() +
            zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2)
        );
    });

    function meridiem(token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(
                this.hours(),
                this.minutes(),
                lowercase
            );
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PRIORITY
    addUnitPriority('hour', 13);

    // PARSING

    function matchMeridiem(isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a', matchMeridiem);
    addRegexToken('A', matchMeridiem);
    addRegexToken('H', match1to2);
    addRegexToken('h', match1to2);
    addRegexToken('k', match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);
    addRegexToken('kk', match1to2, match2);

    addRegexToken('hmm', match3to4);
    addRegexToken('hmmss', match5to6);
    addRegexToken('Hmm', match3to4);
    addRegexToken('Hmmss', match5to6);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['k', 'kk'], function (input, array, config) {
        var kInput = toInt(input);
        array[HOUR] = kInput === 24 ? 0 : kInput;
    });
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmmss', function (input, array, config) {
        var pos1 = input.length - 4,
            pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('Hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
    });
    addParseToken('Hmmss', function (input, array, config) {
        var pos1 = input.length - 4,
            pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
    });

    // LOCALES

    function localeIsPM(input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return (input + '').toLowerCase().charAt(0) === 'p';
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i,
        // Setting the hour should keep the time, because the user explicitly
        // specified which hour they want. So trying to maintain the same hour (in
        // a new timezone) makes sense. Adding/subtracting hours does not follow
        // this rule.
        getSetHour = makeGetSet('Hours', true);

    function localeMeridiem(hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }

    var baseConfig = {
        calendar: defaultCalendar,
        longDateFormat: defaultLongDateFormat,
        invalidDate: defaultInvalidDate,
        ordinal: defaultOrdinal,
        dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
        relativeTime: defaultRelativeTime,

        months: defaultLocaleMonths,
        monthsShort: defaultLocaleMonthsShort,

        week: defaultLocaleWeek,

        weekdays: defaultLocaleWeekdays,
        weekdaysMin: defaultLocaleWeekdaysMin,
        weekdaysShort: defaultLocaleWeekdaysShort,

        meridiemParse: defaultLocaleMeridiemParse,
    };

    // internal storage for locale config files
    var locales = {},
        localeFamilies = {},
        globalLocale;

    function commonPrefix(arr1, arr2) {
        var i,
            minl = Math.min(arr1.length, arr2.length);
        for (i = 0; i < minl; i += 1) {
            if (arr1[i] !== arr2[i]) {
                return i;
            }
        }
        return minl;
    }

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0,
            j,
            next,
            locale,
            split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (
                    next &&
                    next.length >= j &&
                    commonPrefix(split, next) >= j - 1
                ) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return globalLocale;
    }

    function loadLocale(name) {
        var oldLocale = null,
            aliasedRequire;
        // TODO: Find a better way to register and load all the locales in Node
        if (
            locales[name] === undefined &&
            typeof module !== 'undefined' &&
            module &&
            module.exports
        ) {
            try {
                oldLocale = globalLocale._abbr;
                aliasedRequire = require;
                aliasedRequire('./locale/' + name);
                getSetGlobalLocale(oldLocale);
            } catch (e) {
                // mark as not found to avoid repeating expensive file require call causing high CPU
                // when trying to find en-US, en_US, en-us for every format call
                locales[name] = null; // null means not found
            }
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function getSetGlobalLocale(key, values) {
        var data;
        if (key) {
            if (isUndefined(values)) {
                data = getLocale(key);
            } else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            } else {
                if (typeof console !== 'undefined' && console.warn) {
                    //warn user if arguments are passed but the locale could not be set
                    console.warn(
                        'Locale ' + key + ' not found. Did you forget to load it?'
                    );
                }
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale(name, config) {
        if (config !== null) {
            var locale,
                parentConfig = baseConfig;
            config.abbr = name;
            if (locales[name] != null) {
                deprecateSimple(
                    'defineLocaleOverride',
                    'use moment.updateLocale(localeName, config) to change ' +
                    'an existing locale. moment.defineLocale(localeName, ' +
                    'config) should only be used for creating a new locale ' +
                    'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.'
                );
                parentConfig = locales[name]._config;
            } else if (config.parentLocale != null) {
                if (locales[config.parentLocale] != null) {
                    parentConfig = locales[config.parentLocale]._config;
                } else {
                    locale = loadLocale(config.parentLocale);
                    if (locale != null) {
                        parentConfig = locale._config;
                    } else {
                        if (!localeFamilies[config.parentLocale]) {
                            localeFamilies[config.parentLocale] = [];
                        }
                        localeFamilies[config.parentLocale].push({
                            name: name,
                            config: config,
                        });
                        return null;
                    }
                }
            }
            locales[name] = new Locale(mergeConfigs(parentConfig, config));

            if (localeFamilies[name]) {
                localeFamilies[name].forEach(function (x) {
                    defineLocale(x.name, x.config);
                });
            }

            // backwards compat for now: also set the locale
            // make sure we set the locale AFTER all child locales have been
            // created, so we won't end up with the child locale set.
            getSetGlobalLocale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    function updateLocale(name, config) {
        if (config != null) {
            var locale,
                tmpLocale,
                parentConfig = baseConfig;

            if (locales[name] != null && locales[name].parentLocale != null) {
                // Update existing child locale in-place to avoid memory-leaks
                locales[name].set(mergeConfigs(locales[name]._config, config));
            } else {
                // MERGE
                tmpLocale = loadLocale(name);
                if (tmpLocale != null) {
                    parentConfig = tmpLocale._config;
                }
                config = mergeConfigs(parentConfig, config);
                if (tmpLocale == null) {
                    // updateLocale is called for creating a new locale
                    // Set abbr so it will have a name (getters return
                    // undefined otherwise).
                    config.abbr = name;
                }
                locale = new Locale(config);
                locale.parentLocale = locales[name];
                locales[name] = locale;
            }

            // backwards compat for now: also set the locale
            getSetGlobalLocale(name);
        } else {
            // pass null for config to unupdate, useful for tests
            if (locales[name] != null) {
                if (locales[name].parentLocale != null) {
                    locales[name] = locales[name].parentLocale;
                    if (name === getSetGlobalLocale()) {
                        getSetGlobalLocale(name);
                    }
                } else if (locales[name] != null) {
                    delete locales[name];
                }
            }
        }
        return locales[name];
    }

    // returns locale data
    function getLocale(key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    function listLocales() {
        return keys(locales);
    }

    function checkOverflow(m) {
        var overflow,
            a = m._a;

        if (a && getParsingFlags(m).overflow === -2) {
            overflow =
                a[MONTH] < 0 || a[MONTH] > 11
                    ? MONTH
                    : a[DATE] < 1 || a[DATE] > daysInMonth(a[YEAR], a[MONTH])
                        ? DATE
                        : a[HOUR] < 0 ||
                        a[HOUR] > 24 ||
                        (a[HOUR] === 24 &&
                            (a[MINUTE] !== 0 ||
                                a[SECOND] !== 0 ||
                                a[MILLISECOND] !== 0))
                            ? HOUR
                            : a[MINUTE] < 0 || a[MINUTE] > 59
                                ? MINUTE
                                : a[SECOND] < 0 || a[SECOND] > 59
                                    ? SECOND
                                    : a[MILLISECOND] < 0 || a[MILLISECOND] > 999
                                        ? MILLISECOND
                                        : -1;

            if (
                getParsingFlags(m)._overflowDayOfYear &&
                (overflow < YEAR || overflow > DATE)
            ) {
                overflow = DATE;
            }
            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                overflow = WEEK;
            }
            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                overflow = WEEKDAY;
            }

            getParsingFlags(m).overflow = overflow;
        }

        return m;
    }

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
        basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d|))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
        tzRegex = /Z|[+-]\d\d(?::?\d\d)?/,
        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
            ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
            ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
            ['YYYY-DDD', /\d{4}-\d{3}/],
            ['YYYY-MM', /\d{4}-\d\d/, false],
            ['YYYYYYMMDD', /[+-]\d{10}/],
            ['YYYYMMDD', /\d{8}/],
            ['GGGG[W]WWE', /\d{4}W\d{3}/],
            ['GGGG[W]WW', /\d{4}W\d{2}/, false],
            ['YYYYDDD', /\d{7}/],
            ['YYYYMM', /\d{6}/, false],
            ['YYYY', /\d{4}/, false],
        ],
        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
            ['HH:mm:ss', /\d\d:\d\d:\d\d/],
            ['HH:mm', /\d\d:\d\d/],
            ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
            ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
            ['HHmmss', /\d\d\d\d\d\d/],
            ['HHmm', /\d\d\d\d/],
            ['HH', /\d\d/],
        ],
        aspNetJsonRegex = /^\/?Date\((-?\d+)/i,
        // RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
        rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/,
        obsOffsets = {
            UT: 0,
            GMT: 0,
            EDT: -4 * 60,
            EST: -5 * 60,
            CDT: -5 * 60,
            CST: -6 * 60,
            MDT: -6 * 60,
            MST: -7 * 60,
            PDT: -7 * 60,
            PST: -8 * 60,
        };

    // date from iso format
    function configFromISO(config) {
        var i,
            l,
            string = config._i,
            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
            allowTime,
            dateFormat,
            timeFormat,
            tzFormat;

        if (match) {
            getParsingFlags(config).iso = true;

            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(match[1])) {
                    dateFormat = isoDates[i][0];
                    allowTime = isoDates[i][2] !== false;
                    break;
                }
            }
            if (dateFormat == null) {
                config._isValid = false;
                return;
            }
            if (match[3]) {
                for (i = 0, l = isoTimes.length; i < l; i++) {
                    if (isoTimes[i][1].exec(match[3])) {
                        // match[2] should be 'T' or space
                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
                        break;
                    }
                }
                if (timeFormat == null) {
                    config._isValid = false;
                    return;
                }
            }
            if (!allowTime && timeFormat != null) {
                config._isValid = false;
                return;
            }
            if (match[4]) {
                if (tzRegex.exec(match[4])) {
                    tzFormat = 'Z';
                } else {
                    config._isValid = false;
                    return;
                }
            }
            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    function extractFromRFC2822Strings(
        yearStr,
        monthStr,
        dayStr,
        hourStr,
        minuteStr,
        secondStr
    ) {
        var result = [
            untruncateYear(yearStr),
            defaultLocaleMonthsShort.indexOf(monthStr),
            parseInt(dayStr, 10),
            parseInt(hourStr, 10),
            parseInt(minuteStr, 10),
        ];

        if (secondStr) {
            result.push(parseInt(secondStr, 10));
        }

        return result;
    }

    function untruncateYear(yearStr) {
        var year = parseInt(yearStr, 10);
        if (year <= 49) {
            return 2000 + year;
        } else if (year <= 999) {
            return 1900 + year;
        }
        return year;
    }

    function preprocessRFC2822(s) {
        // Remove comments and folding whitespace and replace multiple-spaces with a single space
        return s
            .replace(/\([^)]*\)|[\n\t]/g, ' ')
            .replace(/(\s\s+)/g, ' ')
            .replace(/^\s\s*/, '')
            .replace(/\s\s*$/, '');
    }

    function checkWeekday(weekdayStr, parsedInput, config) {
        if (weekdayStr) {
            // TODO: Replace the vanilla JS Date object with an independent day-of-week check.
            var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
                weekdayActual = new Date(
                    parsedInput[0],
                    parsedInput[1],
                    parsedInput[2]
                ).getDay();
            if (weekdayProvided !== weekdayActual) {
                getParsingFlags(config).weekdayMismatch = true;
                config._isValid = false;
                return false;
            }
        }
        return true;
    }

    function calculateOffset(obsOffset, militaryOffset, numOffset) {
        if (obsOffset) {
            return obsOffsets[obsOffset];
        } else if (militaryOffset) {
            // the only allowed military tz is Z
            return 0;
        } else {
            var hm = parseInt(numOffset, 10),
                m = hm % 100,
                h = (hm - m) / 100;
            return h * 60 + m;
        }
    }

    // date and time from ref 2822 format
    function configFromRFC2822(config) {
        var match = rfc2822.exec(preprocessRFC2822(config._i)),
            parsedArray;
        if (match) {
            parsedArray = extractFromRFC2822Strings(
                match[4],
                match[3],
                match[2],
                match[5],
                match[6],
                match[7]
            );
            if (!checkWeekday(match[1], parsedArray, config)) {
                return;
            }

            config._a = parsedArray;
            config._tzm = calculateOffset(match[8], match[9], match[10]);

            config._d = createUTCDate.apply(null, config._a);
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

            getParsingFlags(config).rfc2822 = true;
        } else {
            config._isValid = false;
        }
    }

    // date from 1) ASP.NET, 2) ISO, 3) RFC 2822 formats, or 4) optional fallback if parsing isn't strict
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);
        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
        } else {
            return;
        }

        configFromRFC2822(config);
        if (config._isValid === false) {
            delete config._isValid;
        } else {
            return;
        }

        if (config._strict) {
            config._isValid = false;
        } else {
            // Final attempt, use Input Fallback
            hooks.createFromInputFallback(config);
        }
    }

    hooks.createFromInputFallback = deprecate(
        'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
        'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
        'discouraged. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        // hooks is actually the exported moment object
        var nowValue = new Date(hooks.now());
        if (config._useUTC) {
            return [
                nowValue.getUTCFullYear(),
                nowValue.getUTCMonth(),
                nowValue.getUTCDate(),
            ];
        }
        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray(config) {
        var i,
            date,
            input = [],
            currentDate,
            expectedWeekday,
            yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear != null) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (
                config._dayOfYear > daysInYear(yearToUse) ||
                config._dayOfYear === 0
            ) {
                getParsingFlags(config)._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] =
                config._a[i] == null ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (
            config._a[HOUR] === 24 &&
            config._a[MINUTE] === 0 &&
            config._a[SECOND] === 0 &&
            config._a[MILLISECOND] === 0
        ) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(
            null,
            input
        );
        expectedWeekday = config._useUTC
            ? config._d.getUTCDay()
            : config._d.getDay();

        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }

        // check for mismatching day of week
        if (
            config._w &&
            typeof config._w.d !== 'undefined' &&
            config._w.d !== expectedWeekday
        ) {
            getParsingFlags(config).weekdayMismatch = true;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow, curWeek;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(
                w.GG,
                config._a[YEAR],
                weekOfYear(createLocal(), 1, 4).year
            );
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
            if (weekday < 1 || weekday > 7) {
                weekdayOverflow = true;
            }
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            curWeek = weekOfYear(createLocal(), dow, doy);

            weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

            // Default to current week.
            week = defaults(w.w, curWeek.week);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < 0 || weekday > 6) {
                    weekdayOverflow = true;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from beginning of week
                weekday = w.e + dow;
                if (w.e < 0 || w.e > 6) {
                    weekdayOverflow = true;
                }
            } else {
                // default to beginning of week
                weekday = dow;
            }
        }
        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
            getParsingFlags(config)._overflowWeeks = true;
        } else if (weekdayOverflow != null) {
            getParsingFlags(config)._overflowWeekday = true;
        } else {
            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }
    }

    // constant that refers to the ISO standard
    hooks.ISO_8601 = function () {};

    // constant that refers to the RFC 2822 form
    hooks.RFC_2822 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === hooks.ISO_8601) {
            configFromISO(config);
            return;
        }
        if (config._f === hooks.RFC_2822) {
            configFromRFC2822(config);
            return;
        }
        config._a = [];
        getParsingFlags(config).empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i,
            parsedInput,
            tokens,
            token,
            skipped,
            stringLength = string.length,
            totalParsedInputLength = 0,
            era;

        tokens =
            expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) ||
                [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    getParsingFlags(config).unusedInput.push(skipped);
                }
                string = string.slice(
                    string.indexOf(parsedInput) + parsedInput.length
                );
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    getParsingFlags(config).empty = false;
                } else {
                    getParsingFlags(config).unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            } else if (config._strict && !parsedInput) {
                getParsingFlags(config).unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        getParsingFlags(config).charsLeftOver =
            stringLength - totalParsedInputLength;
        if (string.length > 0) {
            getParsingFlags(config).unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (
            config._a[HOUR] <= 12 &&
            getParsingFlags(config).bigHour === true &&
            config._a[HOUR] > 0
        ) {
            getParsingFlags(config).bigHour = undefined;
        }

        getParsingFlags(config).parsedDateParts = config._a.slice(0);
        getParsingFlags(config).meridiem = config._meridiem;
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(
            config._locale,
            config._a[HOUR],
            config._meridiem
        );

        // handle era
        era = getParsingFlags(config).era;
        if (era !== null) {
            config._a[YEAR] = config._locale.erasConvertYear(era, config._a[YEAR]);
        }

        configFromArray(config);
        checkOverflow(config);
    }

    function meridiemFixWrap(locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    // date from string and array of format strings
    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,
            scoreToBeat,
            i,
            currentScore,
            validFormatFound,
            bestFormatIsValid = false;

        if (config._f.length === 0) {
            getParsingFlags(config).invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            validFormatFound = false;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (isValid(tempConfig)) {
                validFormatFound = true;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += getParsingFlags(tempConfig).charsLeftOver;

            //or tokens
            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

            getParsingFlags(tempConfig).score = currentScore;

            if (!bestFormatIsValid) {
                if (
                    scoreToBeat == null ||
                    currentScore < scoreToBeat ||
                    validFormatFound
                ) {
                    scoreToBeat = currentScore;
                    bestMoment = tempConfig;
                    if (validFormatFound) {
                        bestFormatIsValid = true;
                    }
                }
            } else {
                if (currentScore < scoreToBeat) {
                    scoreToBeat = currentScore;
                    bestMoment = tempConfig;
                }
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i),
            dayOrDate = i.day === undefined ? i.date : i.day;
        config._a = map(
            [i.year, i.month, dayOrDate, i.hour, i.minute, i.second, i.millisecond],
            function (obj) {
                return obj && parseInt(obj, 10);
            }
        );

        configFromArray(config);
    }

    function createFromConfig(config) {
        var res = new Moment(checkOverflow(prepareConfig(config)));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function prepareConfig(config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return createInvalid({ nullInput: true });
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isDate(input)) {
            config._d = input;
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (format) {
            configFromStringAndFormat(config);
        } else {
            configFromInput(config);
        }

        if (!isValid(config)) {
            config._d = null;
        }

        return config;
    }

    function configFromInput(config) {
        var input = config._i;
        if (isUndefined(input)) {
            config._d = new Date(hooks.now());
        } else if (isDate(input)) {
            config._d = new Date(input.valueOf());
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (isObject(input)) {
            configFromObject(config);
        } else if (isNumber(input)) {
            // from milliseconds
            config._d = new Date(input);
        } else {
            hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC(input, format, locale, strict, isUTC) {
        var c = {};

        if (format === true || format === false) {
            strict = format;
            format = undefined;
        }

        if (locale === true || locale === false) {
            strict = locale;
            locale = undefined;
        }

        if (
            (isObject(input) && isObjectEmpty(input)) ||
            (isArray(input) && input.length === 0)
        ) {
            input = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;

        return createFromConfig(c);
    }

    function createLocal(input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
            'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
            function () {
                var other = createLocal.apply(null, arguments);
                if (this.isValid() && other.isValid()) {
                    return other < this ? this : other;
                } else {
                    return createInvalid();
                }
            }
        ),
        prototypeMax = deprecate(
            'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
            function () {
                var other = createLocal.apply(null, arguments);
                if (this.isValid() && other.isValid()) {
                    return other > this ? this : other;
                } else {
                    return createInvalid();
                }
            }
        );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (!moments[i].isValid() || moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min() {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max() {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    var now = function () {
        return Date.now ? Date.now() : +new Date();
    };

    var ordering = [
        'year',
        'quarter',
        'month',
        'week',
        'day',
        'hour',
        'minute',
        'second',
        'millisecond',
    ];

    function isDurationValid(m) {
        var key,
            unitHasDecimal = false,
            i;
        for (key in m) {
            if (
                hasOwnProp(m, key) &&
                !(
                    indexOf.call(ordering, key) !== -1 &&
                    (m[key] == null || !isNaN(m[key]))
                )
            ) {
                return false;
            }
        }

        for (i = 0; i < ordering.length; ++i) {
            if (m[ordering[i]]) {
                if (unitHasDecimal) {
                    return false; // only allow non-integers for smallest unit
                }
                if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
                    unitHasDecimal = true;
                }
            }
        }

        return true;
    }

    function isValid$1() {
        return this._isValid;
    }

    function createInvalid$1() {
        return createDuration(NaN);
    }

    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || normalizedInput.isoWeek || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        this._isValid = isDurationValid(normalizedInput);

        // representation for dateAddRemove
        this._milliseconds =
            +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days + weeks * 7;
        // It is impossible to translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months + quarters * 3 + years * 12;

        this._data = {};

        this._locale = getLocale();

        this._bubble();
    }

    function isDuration(obj) {
        return obj instanceof Duration;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.round(-1 * number) * -1;
        } else {
            return Math.round(number);
        }
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if (
                (dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))
            ) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    // FORMATTING

    function offset(token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset(),
                sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return (
                sign +
                zeroFill(~~(offset / 60), 2) +
                separator +
                zeroFill(~~offset % 60, 2)
            );
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z', matchShortOffset);
    addRegexToken('ZZ', matchShortOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(matchShortOffset, input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(matcher, string) {
        var matches = (string || '').match(matcher),
            chunk,
            parts,
            minutes;

        if (matches === null) {
            return null;
        }

        chunk = matches[matches.length - 1] || [];
        parts = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        minutes = +(parts[1] * 60) + toInt(parts[2]);

        return minutes === 0 ? 0 : parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff =
                (isMoment(input) || isDate(input)
                    ? input.valueOf()
                    : createLocal(input).valueOf()) - res.valueOf();
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(res._d.valueOf() + diff);
            hooks.updateOffset(res, false);
            return res;
        } else {
            return createLocal(input).local();
        }
    }

    function getDateOffset(m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset());
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset(input, keepLocalTime, keepMinutes) {
        var offset = this._offset || 0,
            localAdjust;
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(matchShortOffset, input);
                if (input === null) {
                    return this;
                }
            } else if (Math.abs(input) < 16 && !keepMinutes) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    addSubtract(
                        this,
                        createDuration(input - offset, 'm'),
                        1,
                        false
                    );
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone(input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC(keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal(keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset() {
        if (this._tzm != null) {
            this.utcOffset(this._tzm, false, true);
        } else if (typeof this._i === 'string') {
            var tZone = offsetFromString(matchOffset, this._i);
            if (tZone != null) {
                this.utcOffset(tZone);
            } else {
                this.utcOffset(0, true);
            }
        }
        return this;
    }

    function hasAlignedHourOffset(input) {
        if (!this.isValid()) {
            return false;
        }
        input = input ? createLocal(input).utcOffset() : 0;

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime() {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted() {
        if (!isUndefined(this._isDSTShifted)) {
            return this._isDSTShifted;
        }

        var c = {},
            other;

        copyConfig(c, this);
        c = prepareConfig(c);

        if (c._a) {
            other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
            this._isDSTShifted =
                this.isValid() && compareArrays(c._a, other.toArray()) > 0;
        } else {
            this._isDSTShifted = false;
        }

        return this._isDSTShifted;
    }

    function isLocal() {
        return this.isValid() ? !this._isUTC : false;
    }

    function isUtcOffset() {
        return this.isValid() ? this._isUTC : false;
    }

    function isUtc() {
        return this.isValid() ? this._isUTC && this._offset === 0 : false;
    }

    // ASP.NET json date format regex
    var aspNetRegex = /^(-|\+)?(?:(\d*)[. ])?(\d+):(\d+)(?::(\d+)(\.\d*)?)?$/,
        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        // and further modified to allow for strings containing both week and day
        isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

    function createDuration(input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months,
            };
        } else if (isNumber(input) || !isNaN(+input)) {
            duration = {};
            if (key) {
                duration[key] = +input;
            } else {
                duration.milliseconds = +input;
            }
        } else if ((match = aspNetRegex.exec(input))) {
            sign = match[1] === '-' ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(absRound(match[MILLISECOND] * 1000)) * sign, // the millisecond decimal point is included in the match
            };
        } else if ((match = isoRegex.exec(input))) {
            sign = match[1] === '-' ? -1 : 1;
            duration = {
                y: parseIso(match[2], sign),
                M: parseIso(match[3], sign),
                w: parseIso(match[4], sign),
                d: parseIso(match[5], sign),
                h: parseIso(match[6], sign),
                m: parseIso(match[7], sign),
                s: parseIso(match[8], sign),
            };
        } else if (duration == null) {
            // checks for null or undefined
            duration = {};
        } else if (
            typeof duration === 'object' &&
            ('from' in duration || 'to' in duration)
        ) {
            diffRes = momentsDifference(
                createLocal(duration.from),
                createLocal(duration.to)
            );

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        if (isDuration(input) && hasOwnProp(input, '_isValid')) {
            ret._isValid = input._isValid;
        }

        return ret;
    }

    createDuration.fn = Duration.prototype;
    createDuration.invalid = createInvalid$1;

    function parseIso(inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = {};

        res.months =
            other.month() - base.month() + (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +base.clone().add(res.months, 'M');

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        if (!(base.isValid() && other.isValid())) {
            return { milliseconds: 0, months: 0 };
        }

        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(
                    name,
                    'moment().' +
                    name +
                    '(period, number) is deprecated. Please use moment().' +
                    name +
                    '(number, period). ' +
                    'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.'
                );
                tmp = val;
                val = period;
                period = tmp;
            }

            dur = createDuration(val, period);
            addSubtract(this, dur, direction);
            return this;
        };
    }

    function addSubtract(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = absRound(duration._days),
            months = absRound(duration._months);

        if (!mom.isValid()) {
            // No op
            return;
        }

        updateOffset = updateOffset == null ? true : updateOffset;

        if (months) {
            setMonth(mom, get(mom, 'Month') + months * isAdding);
        }
        if (days) {
            set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
        }
        if (milliseconds) {
            mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
        }
        if (updateOffset) {
            hooks.updateOffset(mom, days || months);
        }
    }

    var add = createAdder(1, 'add'),
        subtract = createAdder(-1, 'subtract');

    function isString(input) {
        return typeof input === 'string' || input instanceof String;
    }

    // type MomentInput = Moment | Date | string | number | (number | string)[] | MomentInputObject | void; // null | undefined
    function isMomentInput(input) {
        return (
            isMoment(input) ||
            isDate(input) ||
            isString(input) ||
            isNumber(input) ||
            isNumberOrStringArray(input) ||
            isMomentInputObject(input) ||
            input === null ||
            input === undefined
        );
    }

    function isMomentInputObject(input) {
        var objectTest = isObject(input) && !isObjectEmpty(input),
            propertyTest = false,
            properties = [
                'years',
                'year',
                'y',
                'months',
                'month',
                'M',
                'days',
                'day',
                'd',
                'dates',
                'date',
                'D',
                'hours',
                'hour',
                'h',
                'minutes',
                'minute',
                'm',
                'seconds',
                'second',
                's',
                'milliseconds',
                'millisecond',
                'ms',
            ],
            i,
            property;

        for (i = 0; i < properties.length; i += 1) {
            property = properties[i];
            propertyTest = propertyTest || hasOwnProp(input, property);
        }

        return objectTest && propertyTest;
    }

    function isNumberOrStringArray(input) {
        var arrayTest = isArray(input),
            dataTypeTest = false;
        if (arrayTest) {
            dataTypeTest =
                input.filter(function (item) {
                    return !isNumber(item) && isString(input);
                }).length === 0;
        }
        return arrayTest && dataTypeTest;
    }

    function isCalendarSpec(input) {
        var objectTest = isObject(input) && !isObjectEmpty(input),
            propertyTest = false,
            properties = [
                'sameDay',
                'nextDay',
                'lastDay',
                'nextWeek',
                'lastWeek',
                'sameElse',
            ],
            i,
            property;

        for (i = 0; i < properties.length; i += 1) {
            property = properties[i];
            propertyTest = propertyTest || hasOwnProp(input, property);
        }

        return objectTest && propertyTest;
    }

    function getCalendarFormat(myMoment, now) {
        var diff = myMoment.diff(now, 'days', true);
        return diff < -6
            ? 'sameElse'
            : diff < -1
                ? 'lastWeek'
                : diff < 0
                    ? 'lastDay'
                    : diff < 1
                        ? 'sameDay'
                        : diff < 2
                            ? 'nextDay'
                            : diff < 7
                                ? 'nextWeek'
                                : 'sameElse';
    }

    function calendar$1(time, formats) {
        // Support for single parameter, formats only overload to the calendar function
        if (arguments.length === 1) {
            if (!arguments[0]) {
                time = undefined;
                formats = undefined;
            } else if (isMomentInput(arguments[0])) {
                time = arguments[0];
                formats = undefined;
            } else if (isCalendarSpec(arguments[0])) {
                formats = arguments[0];
                time = undefined;
            }
        }
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            format = hooks.calendarFormat(this, sod) || 'sameElse',
            output =
                formats &&
                (isFunction(formats[format])
                    ? formats[format].call(this, now)
                    : formats[format]);

        return this.format(
            output || this.localeData().calendar(format, this, createLocal(now))
        );
    }

    function clone() {
        return new Moment(this);
    }

    function isAfter(input, units) {
        var localInput = isMoment(input) ? input : createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() > localInput.valueOf();
        } else {
            return localInput.valueOf() < this.clone().startOf(units).valueOf();
        }
    }

    function isBefore(input, units) {
        var localInput = isMoment(input) ? input : createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() < localInput.valueOf();
        } else {
            return this.clone().endOf(units).valueOf() < localInput.valueOf();
        }
    }

    function isBetween(from, to, units, inclusivity) {
        var localFrom = isMoment(from) ? from : createLocal(from),
            localTo = isMoment(to) ? to : createLocal(to);
        if (!(this.isValid() && localFrom.isValid() && localTo.isValid())) {
            return false;
        }
        inclusivity = inclusivity || '()';
        return (
            (inclusivity[0] === '('
                ? this.isAfter(localFrom, units)
                : !this.isBefore(localFrom, units)) &&
            (inclusivity[1] === ')'
                ? this.isBefore(localTo, units)
                : !this.isAfter(localTo, units))
        );
    }

    function isSame(input, units) {
        var localInput = isMoment(input) ? input : createLocal(input),
            inputMs;
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() === localInput.valueOf();
        } else {
            inputMs = localInput.valueOf();
            return (
                this.clone().startOf(units).valueOf() <= inputMs &&
                inputMs <= this.clone().endOf(units).valueOf()
            );
        }
    }

    function isSameOrAfter(input, units) {
        return this.isSame(input, units) || this.isAfter(input, units);
    }

    function isSameOrBefore(input, units) {
        return this.isSame(input, units) || this.isBefore(input, units);
    }

    function diff(input, units, asFloat) {
        var that, zoneDelta, output;

        if (!this.isValid()) {
            return NaN;
        }

        that = cloneWithOffset(input, this);

        if (!that.isValid()) {
            return NaN;
        }

        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

        units = normalizeUnits(units);

        switch (units) {
            case 'year':
                output = monthDiff(this, that) / 12;
                break;
            case 'month':
                output = monthDiff(this, that);
                break;
            case 'quarter':
                output = monthDiff(this, that) / 3;
                break;
            case 'second':
                output = (this - that) / 1e3;
                break; // 1000
            case 'minute':
                output = (this - that) / 6e4;
                break; // 1000 * 60
            case 'hour':
                output = (this - that) / 36e5;
                break; // 1000 * 60 * 60
            case 'day':
                output = (this - that - zoneDelta) / 864e5;
                break; // 1000 * 60 * 60 * 24, negate dst
            case 'week':
                output = (this - that - zoneDelta) / 6048e5;
                break; // 1000 * 60 * 60 * 24 * 7, negate dst
            default:
                output = this - that;
        }

        return asFloat ? output : absFloor(output);
    }

    function monthDiff(a, b) {
        if (a.date() < b.date()) {
            // end-of-month calculations work correct when the start month has more
            // days than the end month.
            return -monthDiff(b, a);
        }
        // difference in months
        var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2,
            adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        //check for negative zero, return zero if negative zero
        return -(wholeMonthDiff + adjust) || 0;
    }

    hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

    function toString() {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function toISOString(keepOffset) {
        if (!this.isValid()) {
            return null;
        }
        var utc = keepOffset !== true,
            m = utc ? this.clone().utc() : this;
        if (m.year() < 0 || m.year() > 9999) {
            return formatMoment(
                m,
                utc
                    ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]'
                    : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ'
            );
        }
        if (isFunction(Date.prototype.toISOString)) {
            // native implementation is ~50x faster, use it when we can
            if (utc) {
                return this.toDate().toISOString();
            } else {
                return new Date(this.valueOf() + this.utcOffset() * 60 * 1000)
                    .toISOString()
                    .replace('Z', formatMoment(m, 'Z'));
            }
        }
        return formatMoment(
            m,
            utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ'
        );
    }

    /**
     * Return a human readable representation of a moment that can
     * also be evaluated to get a new moment which is the same
     *
     * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
     */
    function inspect() {
        if (!this.isValid()) {
            return 'moment.invalid(/* ' + this._i + ' */)';
        }
        var func = 'moment',
            zone = '',
            prefix,
            year,
            datetime,
            suffix;
        if (!this.isLocal()) {
            func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
            zone = 'Z';
        }
        prefix = '[' + func + '("]';
        year = 0 <= this.year() && this.year() <= 9999 ? 'YYYY' : 'YYYYYY';
        datetime = '-MM-DD[T]HH:mm:ss.SSS';
        suffix = zone + '[")]';

        return this.format(prefix + year + datetime + suffix);
    }

    function format(inputString) {
        if (!inputString) {
            inputString = this.isUtc()
                ? hooks.defaultFormatUtc
                : hooks.defaultFormat;
        }
        var output = formatMoment(this, inputString);
        return this.localeData().postformat(output);
    }

    function from(time, withoutSuffix) {
        if (
            this.isValid() &&
            ((isMoment(time) && time.isValid()) || createLocal(time).isValid())
        ) {
            return createDuration({ to: this, from: time })
                .locale(this.locale())
                .humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function fromNow(withoutSuffix) {
        return this.from(createLocal(), withoutSuffix);
    }

    function to(time, withoutSuffix) {
        if (
            this.isValid() &&
            ((isMoment(time) && time.isValid()) || createLocal(time).isValid())
        ) {
            return createDuration({ from: this, to: time })
                .locale(this.locale())
                .humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function toNow(withoutSuffix) {
        return this.to(createLocal(), withoutSuffix);
    }

    // If passed a locale key, it will set the locale for this
    // instance.  Otherwise, it will return the locale configuration
    // variables for this instance.
    function locale(key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData() {
        return this._locale;
    }

    var MS_PER_SECOND = 1000,
        MS_PER_MINUTE = 60 * MS_PER_SECOND,
        MS_PER_HOUR = 60 * MS_PER_MINUTE,
        MS_PER_400_YEARS = (365 * 400 + 97) * 24 * MS_PER_HOUR;

    // actual modulo - handles negative numbers (for dates before 1970):
    function mod$1(dividend, divisor) {
        return ((dividend % divisor) + divisor) % divisor;
    }

    function localStartOfDate(y, m, d) {
        // the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            return new Date(y + 400, m, d) - MS_PER_400_YEARS;
        } else {
            return new Date(y, m, d).valueOf();
        }
    }

    function utcStartOfDate(y, m, d) {
        // Date.UTC remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            return Date.UTC(y + 400, m, d) - MS_PER_400_YEARS;
        } else {
            return Date.UTC(y, m, d);
        }
    }

    function startOf(units) {
        var time, startOfDate;
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond' || !this.isValid()) {
            return this;
        }

        startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

        switch (units) {
            case 'year':
                time = startOfDate(this.year(), 0, 1);
                break;
            case 'quarter':
                time = startOfDate(
                    this.year(),
                    this.month() - (this.month() % 3),
                    1
                );
                break;
            case 'month':
                time = startOfDate(this.year(), this.month(), 1);
                break;
            case 'week':
                time = startOfDate(
                    this.year(),
                    this.month(),
                    this.date() - this.weekday()
                );
                break;
            case 'isoWeek':
                time = startOfDate(
                    this.year(),
                    this.month(),
                    this.date() - (this.isoWeekday() - 1)
                );
                break;
            case 'day':
            case 'date':
                time = startOfDate(this.year(), this.month(), this.date());
                break;
            case 'hour':
                time = this._d.valueOf();
                time -= mod$1(
                    time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
                    MS_PER_HOUR
                );
                break;
            case 'minute':
                time = this._d.valueOf();
                time -= mod$1(time, MS_PER_MINUTE);
                break;
            case 'second':
                time = this._d.valueOf();
                time -= mod$1(time, MS_PER_SECOND);
                break;
        }

        this._d.setTime(time);
        hooks.updateOffset(this, true);
        return this;
    }

    function endOf(units) {
        var time, startOfDate;
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond' || !this.isValid()) {
            return this;
        }

        startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

        switch (units) {
            case 'year':
                time = startOfDate(this.year() + 1, 0, 1) - 1;
                break;
            case 'quarter':
                time =
                    startOfDate(
                        this.year(),
                        this.month() - (this.month() % 3) + 3,
                        1
                    ) - 1;
                break;
            case 'month':
                time = startOfDate(this.year(), this.month() + 1, 1) - 1;
                break;
            case 'week':
                time =
                    startOfDate(
                        this.year(),
                        this.month(),
                        this.date() - this.weekday() + 7
                    ) - 1;
                break;
            case 'isoWeek':
                time =
                    startOfDate(
                        this.year(),
                        this.month(),
                        this.date() - (this.isoWeekday() - 1) + 7
                    ) - 1;
                break;
            case 'day':
            case 'date':
                time = startOfDate(this.year(), this.month(), this.date() + 1) - 1;
                break;
            case 'hour':
                time = this._d.valueOf();
                time +=
                    MS_PER_HOUR -
                    mod$1(
                        time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
                        MS_PER_HOUR
                    ) -
                    1;
                break;
            case 'minute':
                time = this._d.valueOf();
                time += MS_PER_MINUTE - mod$1(time, MS_PER_MINUTE) - 1;
                break;
            case 'second':
                time = this._d.valueOf();
                time += MS_PER_SECOND - mod$1(time, MS_PER_SECOND) - 1;
                break;
        }

        this._d.setTime(time);
        hooks.updateOffset(this, true);
        return this;
    }

    function valueOf() {
        return this._d.valueOf() - (this._offset || 0) * 60000;
    }

    function unix() {
        return Math.floor(this.valueOf() / 1000);
    }

    function toDate() {
        return new Date(this.valueOf());
    }

    function toArray() {
        var m = this;
        return [
            m.year(),
            m.month(),
            m.date(),
            m.hour(),
            m.minute(),
            m.second(),
            m.millisecond(),
        ];
    }

    function toObject() {
        var m = this;
        return {
            years: m.year(),
            months: m.month(),
            date: m.date(),
            hours: m.hours(),
            minutes: m.minutes(),
            seconds: m.seconds(),
            milliseconds: m.milliseconds(),
        };
    }

    function toJSON() {
        // new Date(NaN).toJSON() === null
        return this.isValid() ? this.toISOString() : null;
    }

    function isValid$2() {
        return isValid(this);
    }

    function parsingFlags() {
        return extend({}, getParsingFlags(this));
    }

    function invalidAt() {
        return getParsingFlags(this).overflow;
    }

    function creationData() {
        return {
            input: this._i,
            format: this._f,
            locale: this._locale,
            isUTC: this._isUTC,
            strict: this._strict,
        };
    }

    addFormatToken('N', 0, 0, 'eraAbbr');
    addFormatToken('NN', 0, 0, 'eraAbbr');
    addFormatToken('NNN', 0, 0, 'eraAbbr');
    addFormatToken('NNNN', 0, 0, 'eraName');
    addFormatToken('NNNNN', 0, 0, 'eraNarrow');

    addFormatToken('y', ['y', 1], 'yo', 'eraYear');
    addFormatToken('y', ['yy', 2], 0, 'eraYear');
    addFormatToken('y', ['yyy', 3], 0, 'eraYear');
    addFormatToken('y', ['yyyy', 4], 0, 'eraYear');

    addRegexToken('N', matchEraAbbr);
    addRegexToken('NN', matchEraAbbr);
    addRegexToken('NNN', matchEraAbbr);
    addRegexToken('NNNN', matchEraName);
    addRegexToken('NNNNN', matchEraNarrow);

    addParseToken(['N', 'NN', 'NNN', 'NNNN', 'NNNNN'], function (
        input,
        array,
        config,
        token
    ) {
        var era = config._locale.erasParse(input, token, config._strict);
        if (era) {
            getParsingFlags(config).era = era;
        } else {
            getParsingFlags(config).invalidEra = input;
        }
    });

    addRegexToken('y', matchUnsigned);
    addRegexToken('yy', matchUnsigned);
    addRegexToken('yyy', matchUnsigned);
    addRegexToken('yyyy', matchUnsigned);
    addRegexToken('yo', matchEraYearOrdinal);

    addParseToken(['y', 'yy', 'yyy', 'yyyy'], YEAR);
    addParseToken(['yo'], function (input, array, config, token) {
        var match;
        if (config._locale._eraYearOrdinalRegex) {
            match = input.match(config._locale._eraYearOrdinalRegex);
        }

        if (config._locale.eraYearOrdinalParse) {
            array[YEAR] = config._locale.eraYearOrdinalParse(input, match);
        } else {
            array[YEAR] = parseInt(input, 10);
        }
    });

    function localeEras(m, format) {
        var i,
            l,
            date,
            eras = this._eras || getLocale('en')._eras;
        for (i = 0, l = eras.length; i < l; ++i) {
            switch (typeof eras[i].since) {
                case 'string':
                    // truncate time
                    date = hooks(eras[i].since).startOf('day');
                    eras[i].since = date.valueOf();
                    break;
            }

            switch (typeof eras[i].until) {
                case 'undefined':
                    eras[i].until = +Infinity;
                    break;
                case 'string':
                    // truncate time
                    date = hooks(eras[i].until).startOf('day').valueOf();
                    eras[i].until = date.valueOf();
                    break;
            }
        }
        return eras;
    }

    function localeErasParse(eraName, format, strict) {
        var i,
            l,
            eras = this.eras(),
            name,
            abbr,
            narrow;
        eraName = eraName.toUpperCase();

        for (i = 0, l = eras.length; i < l; ++i) {
            name = eras[i].name.toUpperCase();
            abbr = eras[i].abbr.toUpperCase();
            narrow = eras[i].narrow.toUpperCase();

            if (strict) {
                switch (format) {
                    case 'N':
                    case 'NN':
                    case 'NNN':
                        if (abbr === eraName) {
                            return eras[i];
                        }
                        break;

                    case 'NNNN':
                        if (name === eraName) {
                            return eras[i];
                        }
                        break;

                    case 'NNNNN':
                        if (narrow === eraName) {
                            return eras[i];
                        }
                        break;
                }
            } else if ([name, abbr, narrow].indexOf(eraName) >= 0) {
                return eras[i];
            }
        }
    }

    function localeErasConvertYear(era, year) {
        var dir = era.since <= era.until ? +1 : -1;
        if (year === undefined) {
            return hooks(era.since).year();
        } else {
            return hooks(era.since).year() + (year - era.offset) * dir;
        }
    }

    function getEraName() {
        var i,
            l,
            val,
            eras = this.localeData().eras();
        for (i = 0, l = eras.length; i < l; ++i) {
            // truncate time
            val = this.clone().startOf('day').valueOf();

            if (eras[i].since <= val && val <= eras[i].until) {
                return eras[i].name;
            }
            if (eras[i].until <= val && val <= eras[i].since) {
                return eras[i].name;
            }
        }

        return '';
    }

    function getEraNarrow() {
        var i,
            l,
            val,
            eras = this.localeData().eras();
        for (i = 0, l = eras.length; i < l; ++i) {
            // truncate time
            val = this.clone().startOf('day').valueOf();

            if (eras[i].since <= val && val <= eras[i].until) {
                return eras[i].narrow;
            }
            if (eras[i].until <= val && val <= eras[i].since) {
                return eras[i].narrow;
            }
        }

        return '';
    }

    function getEraAbbr() {
        var i,
            l,
            val,
            eras = this.localeData().eras();
        for (i = 0, l = eras.length; i < l; ++i) {
            // truncate time
            val = this.clone().startOf('day').valueOf();

            if (eras[i].since <= val && val <= eras[i].until) {
                return eras[i].abbr;
            }
            if (eras[i].until <= val && val <= eras[i].since) {
                return eras[i].abbr;
            }
        }

        return '';
    }

    function getEraYear() {
        var i,
            l,
            dir,
            val,
            eras = this.localeData().eras();
        for (i = 0, l = eras.length; i < l; ++i) {
            dir = eras[i].since <= eras[i].until ? +1 : -1;

            // truncate time
            val = this.clone().startOf('day').valueOf();

            if (
                (eras[i].since <= val && val <= eras[i].until) ||
                (eras[i].until <= val && val <= eras[i].since)
            ) {
                return (
                    (this.year() - hooks(eras[i].since).year()) * dir +
                    eras[i].offset
                );
            }
        }

        return this.year();
    }

    function erasNameRegex(isStrict) {
        if (!hasOwnProp(this, '_erasNameRegex')) {
            computeErasParse.call(this);
        }
        return isStrict ? this._erasNameRegex : this._erasRegex;
    }

    function erasAbbrRegex(isStrict) {
        if (!hasOwnProp(this, '_erasAbbrRegex')) {
            computeErasParse.call(this);
        }
        return isStrict ? this._erasAbbrRegex : this._erasRegex;
    }

    function erasNarrowRegex(isStrict) {
        if (!hasOwnProp(this, '_erasNarrowRegex')) {
            computeErasParse.call(this);
        }
        return isStrict ? this._erasNarrowRegex : this._erasRegex;
    }

    function matchEraAbbr(isStrict, locale) {
        return locale.erasAbbrRegex(isStrict);
    }

    function matchEraName(isStrict, locale) {
        return locale.erasNameRegex(isStrict);
    }

    function matchEraNarrow(isStrict, locale) {
        return locale.erasNarrowRegex(isStrict);
    }

    function matchEraYearOrdinal(isStrict, locale) {
        return locale._eraYearOrdinalRegex || matchUnsigned;
    }

    function computeErasParse() {
        var abbrPieces = [],
            namePieces = [],
            narrowPieces = [],
            mixedPieces = [],
            i,
            l,
            eras = this.eras();

        for (i = 0, l = eras.length; i < l; ++i) {
            namePieces.push(regexEscape(eras[i].name));
            abbrPieces.push(regexEscape(eras[i].abbr));
            narrowPieces.push(regexEscape(eras[i].narrow));

            mixedPieces.push(regexEscape(eras[i].name));
            mixedPieces.push(regexEscape(eras[i].abbr));
            mixedPieces.push(regexEscape(eras[i].narrow));
        }

        this._erasRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._erasNameRegex = new RegExp('^(' + namePieces.join('|') + ')', 'i');
        this._erasAbbrRegex = new RegExp('^(' + abbrPieces.join('|') + ')', 'i');
        this._erasNarrowRegex = new RegExp(
            '^(' + narrowPieces.join('|') + ')',
            'i'
        );
    }

    // FORMATTING

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken(token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg', 'weekYear');
    addWeekYearFormatToken('ggggg', 'weekYear');
    addWeekYearFormatToken('GGGG', 'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PRIORITY

    addUnitPriority('weekYear', 1);
    addUnitPriority('isoWeekYear', 1);

    // PARSING

    addRegexToken('G', matchSigned);
    addRegexToken('g', matchSigned);
    addRegexToken('GG', match1to2, match2);
    addRegexToken('gg', match1to2, match2);
    addRegexToken('GGGG', match1to4, match4);
    addRegexToken('gggg', match1to4, match4);
    addRegexToken('GGGGG', match1to6, match6);
    addRegexToken('ggggg', match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (
        input,
        week,
        config,
        token
    ) {
        week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = hooks.parseTwoDigitYear(input);
    });

    // MOMENTS

    function getSetWeekYear(input) {
        return getSetWeekYearHelper.call(
            this,
            input,
            this.week(),
            this.weekday(),
            this.localeData()._week.dow,
            this.localeData()._week.doy
        );
    }

    function getSetISOWeekYear(input) {
        return getSetWeekYearHelper.call(
            this,
            input,
            this.isoWeek(),
            this.isoWeekday(),
            1,
            4
        );
    }

    function getISOWeeksInYear() {
        return weeksInYear(this.year(), 1, 4);
    }

    function getISOWeeksInISOWeekYear() {
        return weeksInYear(this.isoWeekYear(), 1, 4);
    }

    function getWeeksInYear() {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    function getWeeksInWeekYear() {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.weekYear(), weekInfo.dow, weekInfo.doy);
    }

    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
        var weeksTarget;
        if (input == null) {
            return weekOfYear(this, dow, doy).year;
        } else {
            weeksTarget = weeksInYear(input, dow, doy);
            if (week > weeksTarget) {
                week = weeksTarget;
            }
            return setWeekAll.call(this, input, week, weekday, dow, doy);
        }
    }

    function setWeekAll(weekYear, week, weekday, dow, doy) {
        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

        this.year(date.getUTCFullYear());
        this.month(date.getUTCMonth());
        this.date(date.getUTCDate());
        return this;
    }

    // FORMATTING

    addFormatToken('Q', 0, 'Qo', 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PRIORITY

    addUnitPriority('quarter', 7);

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter(input) {
        return input == null
            ? Math.ceil((this.month() + 1) / 3)
            : this.month((input - 1) * 3 + (this.month() % 3));
    }

    // FORMATTING

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PRIORITY
    addUnitPriority('date', 9);

    // PARSING

    addRegexToken('D', match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        // TODO: Remove "ordinalParse" fallback in next major release.
        return isStrict
            ? locale._dayOfMonthOrdinalParse || locale._ordinalParse
            : locale._dayOfMonthOrdinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0]);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    // FORMATTING

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PRIORITY
    addUnitPriority('dayOfYear', 4);

    // PARSING

    addRegexToken('DDD', match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    // MOMENTS

    function getSetDayOfYear(input) {
        var dayOfYear =
            Math.round(
                (this.clone().startOf('day') - this.clone().startOf('year')) / 864e5
            ) + 1;
        return input == null ? dayOfYear : this.add(input - dayOfYear, 'd');
    }

    // FORMATTING

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PRIORITY

    addUnitPriority('minute', 14);

    // PARSING

    addRegexToken('m', match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    // FORMATTING

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PRIORITY

    addUnitPriority('second', 15);

    // PARSING

    addRegexToken('s', match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    // FORMATTING

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
        return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
        return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
        return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
        return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
        return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
        return this.millisecond() * 1000000;
    });

    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PRIORITY

    addUnitPriority('millisecond', 16);

    // PARSING

    addRegexToken('S', match1to3, match1);
    addRegexToken('SS', match1to3, match2);
    addRegexToken('SSS', match1to3, match3);

    var token, getSetMillisecond;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
        addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
        addParseToken(token, parseMs);
    }

    getSetMillisecond = makeGetSet('Milliseconds', false);

    // FORMATTING

    addFormatToken('z', 0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr() {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName() {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var proto = Moment.prototype;

    proto.add = add;
    proto.calendar = calendar$1;
    proto.clone = clone;
    proto.diff = diff;
    proto.endOf = endOf;
    proto.format = format;
    proto.from = from;
    proto.fromNow = fromNow;
    proto.to = to;
    proto.toNow = toNow;
    proto.get = stringGet;
    proto.invalidAt = invalidAt;
    proto.isAfter = isAfter;
    proto.isBefore = isBefore;
    proto.isBetween = isBetween;
    proto.isSame = isSame;
    proto.isSameOrAfter = isSameOrAfter;
    proto.isSameOrBefore = isSameOrBefore;
    proto.isValid = isValid$2;
    proto.lang = lang;
    proto.locale = locale;
    proto.localeData = localeData;
    proto.max = prototypeMax;
    proto.min = prototypeMin;
    proto.parsingFlags = parsingFlags;
    proto.set = stringSet;
    proto.startOf = startOf;
    proto.subtract = subtract;
    proto.toArray = toArray;
    proto.toObject = toObject;
    proto.toDate = toDate;
    proto.toISOString = toISOString;
    proto.inspect = inspect;
    if (typeof Symbol !== 'undefined' && Symbol.for != null) {
        proto[Symbol.for('nodejs.util.inspect.custom')] = function () {
            return 'Moment<' + this.format() + '>';
        };
    }
    proto.toJSON = toJSON;
    proto.toString = toString;
    proto.unix = unix;
    proto.valueOf = valueOf;
    proto.creationData = creationData;
    proto.eraName = getEraName;
    proto.eraNarrow = getEraNarrow;
    proto.eraAbbr = getEraAbbr;
    proto.eraYear = getEraYear;
    proto.year = getSetYear;
    proto.isLeapYear = getIsLeapYear;
    proto.weekYear = getSetWeekYear;
    proto.isoWeekYear = getSetISOWeekYear;
    proto.quarter = proto.quarters = getSetQuarter;
    proto.month = getSetMonth;
    proto.daysInMonth = getDaysInMonth;
    proto.week = proto.weeks = getSetWeek;
    proto.isoWeek = proto.isoWeeks = getSetISOWeek;
    proto.weeksInYear = getWeeksInYear;
    proto.weeksInWeekYear = getWeeksInWeekYear;
    proto.isoWeeksInYear = getISOWeeksInYear;
    proto.isoWeeksInISOWeekYear = getISOWeeksInISOWeekYear;
    proto.date = getSetDayOfMonth;
    proto.day = proto.days = getSetDayOfWeek;
    proto.weekday = getSetLocaleDayOfWeek;
    proto.isoWeekday = getSetISODayOfWeek;
    proto.dayOfYear = getSetDayOfYear;
    proto.hour = proto.hours = getSetHour;
    proto.minute = proto.minutes = getSetMinute;
    proto.second = proto.seconds = getSetSecond;
    proto.millisecond = proto.milliseconds = getSetMillisecond;
    proto.utcOffset = getSetOffset;
    proto.utc = setOffsetToUTC;
    proto.local = setOffsetToLocal;
    proto.parseZone = setOffsetToParsedOffset;
    proto.hasAlignedHourOffset = hasAlignedHourOffset;
    proto.isDST = isDaylightSavingTime;
    proto.isLocal = isLocal;
    proto.isUtcOffset = isUtcOffset;
    proto.isUtc = isUtc;
    proto.isUTC = isUtc;
    proto.zoneAbbr = getZoneAbbr;
    proto.zoneName = getZoneName;
    proto.dates = deprecate(
        'dates accessor is deprecated. Use date instead.',
        getSetDayOfMonth
    );
    proto.months = deprecate(
        'months accessor is deprecated. Use month instead',
        getSetMonth
    );
    proto.years = deprecate(
        'years accessor is deprecated. Use year instead',
        getSetYear
    );
    proto.zone = deprecate(
        'moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/',
        getSetZone
    );
    proto.isDSTShifted = deprecate(
        'isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information',
        isDaylightSavingTimeShifted
    );

    function createUnix(input) {
        return createLocal(input * 1000);
    }

    function createInZone() {
        return createLocal.apply(null, arguments).parseZone();
    }

    function preParsePostFormat(string) {
        return string;
    }

    var proto$1 = Locale.prototype;

    proto$1.calendar = calendar;
    proto$1.longDateFormat = longDateFormat;
    proto$1.invalidDate = invalidDate;
    proto$1.ordinal = ordinal;
    proto$1.preparse = preParsePostFormat;
    proto$1.postformat = preParsePostFormat;
    proto$1.relativeTime = relativeTime;
    proto$1.pastFuture = pastFuture;
    proto$1.set = set;
    proto$1.eras = localeEras;
    proto$1.erasParse = localeErasParse;
    proto$1.erasConvertYear = localeErasConvertYear;
    proto$1.erasAbbrRegex = erasAbbrRegex;
    proto$1.erasNameRegex = erasNameRegex;
    proto$1.erasNarrowRegex = erasNarrowRegex;

    proto$1.months = localeMonths;
    proto$1.monthsShort = localeMonthsShort;
    proto$1.monthsParse = localeMonthsParse;
    proto$1.monthsRegex = monthsRegex;
    proto$1.monthsShortRegex = monthsShortRegex;
    proto$1.week = localeWeek;
    proto$1.firstDayOfYear = localeFirstDayOfYear;
    proto$1.firstDayOfWeek = localeFirstDayOfWeek;

    proto$1.weekdays = localeWeekdays;
    proto$1.weekdaysMin = localeWeekdaysMin;
    proto$1.weekdaysShort = localeWeekdaysShort;
    proto$1.weekdaysParse = localeWeekdaysParse;

    proto$1.weekdaysRegex = weekdaysRegex;
    proto$1.weekdaysShortRegex = weekdaysShortRegex;
    proto$1.weekdaysMinRegex = weekdaysMinRegex;

    proto$1.isPM = localeIsPM;
    proto$1.meridiem = localeMeridiem;

    function get$1(format, index, field, setter) {
        var locale = getLocale(),
            utc = createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function listMonthsImpl(format, index, field) {
        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return get$1(format, index, field, 'month');
        }

        var i,
            out = [];
        for (i = 0; i < 12; i++) {
            out[i] = get$1(format, i, field, 'month');
        }
        return out;
    }

    // ()
    // (5)
    // (fmt, 5)
    // (fmt)
    // (true)
    // (true, 5)
    // (true, fmt, 5)
    // (true, fmt)
    function listWeekdaysImpl(localeSorted, format, index, field) {
        if (typeof localeSorted === 'boolean') {
            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';
        } else {
            format = localeSorted;
            index = format;
            localeSorted = false;

            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';
        }

        var locale = getLocale(),
            shift = localeSorted ? locale._week.dow : 0,
            i,
            out = [];

        if (index != null) {
            return get$1(format, (index + shift) % 7, field, 'day');
        }

        for (i = 0; i < 7; i++) {
            out[i] = get$1(format, (i + shift) % 7, field, 'day');
        }
        return out;
    }

    function listMonths(format, index) {
        return listMonthsImpl(format, index, 'months');
    }

    function listMonthsShort(format, index) {
        return listMonthsImpl(format, index, 'monthsShort');
    }

    function listWeekdays(localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
    }

    function listWeekdaysShort(localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
    }

    function listWeekdaysMin(localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
    }

    getSetGlobalLocale('en', {
        eras: [
            {
                since: '0001-01-01',
                until: +Infinity,
                offset: 1,
                name: 'Anno Domini',
                narrow: 'AD',
                abbr: 'AD',
            },
            {
                since: '0000-12-31',
                until: -Infinity,
                offset: 1,
                name: 'Before Christ',
                narrow: 'BC',
                abbr: 'BC',
            },
        ],
        dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal: function (number) {
            var b = number % 10,
                output =
                    toInt((number % 100) / 10) === 1
                        ? 'th'
                        : b === 1
                            ? 'st'
                            : b === 2
                                ? 'nd'
                                : b === 3
                                    ? 'rd'
                                    : 'th';
            return number + output;
        },
    });

    // Side effect imports

    hooks.lang = deprecate(
        'moment.lang is deprecated. Use moment.locale instead.',
        getSetGlobalLocale
    );
    hooks.langData = deprecate(
        'moment.langData is deprecated. Use moment.localeData instead.',
        getLocale
    );

    var mathAbs = Math.abs;

    function abs() {
        var data = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days = mathAbs(this._days);
        this._months = mathAbs(this._months);

        data.milliseconds = mathAbs(data.milliseconds);
        data.seconds = mathAbs(data.seconds);
        data.minutes = mathAbs(data.minutes);
        data.hours = mathAbs(data.hours);
        data.months = mathAbs(data.months);
        data.years = mathAbs(data.years);

        return this;
    }

    function addSubtract$1(duration, input, value, direction) {
        var other = createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days += direction * other._days;
        duration._months += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function add$1(input, value) {
        return addSubtract$1(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function subtract$1(input, value) {
        return addSubtract$1(this, input, value, -1);
    }

    function absCeil(number) {
        if (number < 0) {
            return Math.floor(number);
        } else {
            return Math.ceil(number);
        }
    }

    function bubble() {
        var milliseconds = this._milliseconds,
            days = this._days,
            months = this._months,
            data = this._data,
            seconds,
            minutes,
            hours,
            years,
            monthsFromDays;

        // if we have a mix of positive and negative values, bubble down first
        // check: https://github.com/moment/moment/issues/2166
        if (
            !(
                (milliseconds >= 0 && days >= 0 && months >= 0) ||
                (milliseconds <= 0 && days <= 0 && months <= 0)
            )
        ) {
            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
            days = 0;
            months = 0;
        }

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds = absFloor(milliseconds / 1000);
        data.seconds = seconds % 60;

        minutes = absFloor(seconds / 60);
        data.minutes = minutes % 60;

        hours = absFloor(minutes / 60);
        data.hours = hours % 24;

        days += absFloor(hours / 24);

        // convert days to months
        monthsFromDays = absFloor(daysToMonths(days));
        months += monthsFromDays;
        days -= absCeil(monthsToDays(monthsFromDays));

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        data.days = days;
        data.months = months;
        data.years = years;

        return this;
    }

    function daysToMonths(days) {
        // 400 years have 146097 days (taking into account leap year rules)
        // 400 years have 12 months === 4800
        return (days * 4800) / 146097;
    }

    function monthsToDays(months) {
        // the reverse of daysToMonths
        return (months * 146097) / 4800;
    }

    function as(units) {
        if (!this.isValid()) {
            return NaN;
        }
        var days,
            months,
            milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'quarter' || units === 'year') {
            days = this._days + milliseconds / 864e5;
            months = this._months + daysToMonths(days);
            switch (units) {
                case 'month':
                    return months;
                case 'quarter':
                    return months / 3;
                case 'year':
                    return months / 12;
            }
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(monthsToDays(this._months));
            switch (units) {
                case 'week':
                    return days / 7 + milliseconds / 6048e5;
                case 'day':
                    return days + milliseconds / 864e5;
                case 'hour':
                    return days * 24 + milliseconds / 36e5;
                case 'minute':
                    return days * 1440 + milliseconds / 6e4;
                case 'second':
                    return days * 86400 + milliseconds / 1000;
                // Math.floor prevents floating point math errors here
                case 'millisecond':
                    return Math.floor(days * 864e5) + milliseconds;
                default:
                    throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function valueOf$1() {
        if (!this.isValid()) {
            return NaN;
        }
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs(alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms'),
        asSeconds = makeAs('s'),
        asMinutes = makeAs('m'),
        asHours = makeAs('h'),
        asDays = makeAs('d'),
        asWeeks = makeAs('w'),
        asMonths = makeAs('M'),
        asQuarters = makeAs('Q'),
        asYears = makeAs('y');

    function clone$1() {
        return createDuration(this);
    }

    function get$2(units) {
        units = normalizeUnits(units);
        return this.isValid() ? this[units + 's']() : NaN;
    }

    function makeGetter(name) {
        return function () {
            return this.isValid() ? this._data[name] : NaN;
        };
    }

    var milliseconds = makeGetter('milliseconds'),
        seconds = makeGetter('seconds'),
        minutes = makeGetter('minutes'),
        hours = makeGetter('hours'),
        days = makeGetter('days'),
        months = makeGetter('months'),
        years = makeGetter('years');

    function weeks() {
        return absFloor(this.days() / 7);
    }

    var round = Math.round,
        thresholds = {
            ss: 44, // a few seconds to seconds
            s: 45, // seconds to minute
            m: 45, // minutes to hour
            h: 22, // hours to day
            d: 26, // days to month/week
            w: null, // weeks to month
            M: 11, // months to year
        };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime$1(posNegDuration, withoutSuffix, thresholds, locale) {
        var duration = createDuration(posNegDuration).abs(),
            seconds = round(duration.as('s')),
            minutes = round(duration.as('m')),
            hours = round(duration.as('h')),
            days = round(duration.as('d')),
            months = round(duration.as('M')),
            weeks = round(duration.as('w')),
            years = round(duration.as('y')),
            a =
                (seconds <= thresholds.ss && ['s', seconds]) ||
                (seconds < thresholds.s && ['ss', seconds]) ||
                (minutes <= 1 && ['m']) ||
                (minutes < thresholds.m && ['mm', minutes]) ||
                (hours <= 1 && ['h']) ||
                (hours < thresholds.h && ['hh', hours]) ||
                (days <= 1 && ['d']) ||
                (days < thresholds.d && ['dd', days]);

        if (thresholds.w != null) {
            a =
                a ||
                (weeks <= 1 && ['w']) ||
                (weeks < thresholds.w && ['ww', weeks]);
        }
        a = a ||
            (months <= 1 && ['M']) ||
            (months < thresholds.M && ['MM', months]) ||
            (years <= 1 && ['y']) || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set the rounding function for relative time strings
    function getSetRelativeTimeRounding(roundingFunction) {
        if (roundingFunction === undefined) {
            return round;
        }
        if (typeof roundingFunction === 'function') {
            round = roundingFunction;
            return true;
        }
        return false;
    }

    // This function allows you to set a threshold for relative time strings
    function getSetRelativeTimeThreshold(threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        if (threshold === 's') {
            thresholds.ss = limit - 1;
        }
        return true;
    }

    function humanize(argWithSuffix, argThresholds) {
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }

        var withSuffix = false,
            th = thresholds,
            locale,
            output;

        if (typeof argWithSuffix === 'object') {
            argThresholds = argWithSuffix;
            argWithSuffix = false;
        }
        if (typeof argWithSuffix === 'boolean') {
            withSuffix = argWithSuffix;
        }
        if (typeof argThresholds === 'object') {
            th = Object.assign({}, thresholds, argThresholds);
            if (argThresholds.s != null && argThresholds.ss == null) {
                th.ss = argThresholds.s - 1;
            }
        }

        locale = this.localeData();
        output = relativeTime$1(this, !withSuffix, th, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var abs$1 = Math.abs;

    function sign(x) {
        return (x > 0) - (x < 0) || +x;
    }

    function toISOString$1() {
        // for ISO strings we do not use the normal bubbling rules:
        //  * milliseconds bubble up until they become hours
        //  * days do not bubble at all
        //  * months bubble up until they become years
        // This is because there is no context-free conversion between hours and days
        // (think of clock changes)
        // and also not between days and months (28-31 days per month)
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }

        var seconds = abs$1(this._milliseconds) / 1000,
            days = abs$1(this._days),
            months = abs$1(this._months),
            minutes,
            hours,
            years,
            s,
            total = this.asSeconds(),
            totalSign,
            ymSign,
            daysSign,
            hmsSign;

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        // 3600 seconds -> 60 minutes -> 1 hour
        minutes = absFloor(seconds / 60);
        hours = absFloor(minutes / 60);
        seconds %= 60;
        minutes %= 60;

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';

        totalSign = total < 0 ? '-' : '';
        ymSign = sign(this._months) !== sign(total) ? '-' : '';
        daysSign = sign(this._days) !== sign(total) ? '-' : '';
        hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';

        return (
            totalSign +
            'P' +
            (years ? ymSign + years + 'Y' : '') +
            (months ? ymSign + months + 'M' : '') +
            (days ? daysSign + days + 'D' : '') +
            (hours || minutes || seconds ? 'T' : '') +
            (hours ? hmsSign + hours + 'H' : '') +
            (minutes ? hmsSign + minutes + 'M' : '') +
            (seconds ? hmsSign + s + 'S' : '')
        );
    }

    var proto$2 = Duration.prototype;

    proto$2.isValid = isValid$1;
    proto$2.abs = abs;
    proto$2.add = add$1;
    proto$2.subtract = subtract$1;
    proto$2.as = as;
    proto$2.asMilliseconds = asMilliseconds;
    proto$2.asSeconds = asSeconds;
    proto$2.asMinutes = asMinutes;
    proto$2.asHours = asHours;
    proto$2.asDays = asDays;
    proto$2.asWeeks = asWeeks;
    proto$2.asMonths = asMonths;
    proto$2.asQuarters = asQuarters;
    proto$2.asYears = asYears;
    proto$2.valueOf = valueOf$1;
    proto$2._bubble = bubble;
    proto$2.clone = clone$1;
    proto$2.get = get$2;
    proto$2.milliseconds = milliseconds;
    proto$2.seconds = seconds;
    proto$2.minutes = minutes;
    proto$2.hours = hours;
    proto$2.days = days;
    proto$2.weeks = weeks;
    proto$2.months = months;
    proto$2.years = years;
    proto$2.humanize = humanize;
    proto$2.toISOString = toISOString$1;
    proto$2.toString = toISOString$1;
    proto$2.toJSON = toISOString$1;
    proto$2.locale = locale;
    proto$2.localeData = localeData;

    proto$2.toIsoString = deprecate(
        'toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)',
        toISOString$1
    );
    proto$2.lang = lang;

    // FORMATTING

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    //! moment.js

    hooks.version = '2.29.1';

    setHookCallback(createLocal);

    hooks.fn = proto;
    hooks.min = min;
    hooks.max = max;
    hooks.now = now;
    hooks.utc = createUTC;
    hooks.unix = createUnix;
    hooks.months = listMonths;
    hooks.isDate = isDate;
    hooks.locale = getSetGlobalLocale;
    hooks.invalid = createInvalid;
    hooks.duration = createDuration;
    hooks.isMoment = isMoment;
    hooks.weekdays = listWeekdays;
    hooks.parseZone = createInZone;
    hooks.localeData = getLocale;
    hooks.isDuration = isDuration;
    hooks.monthsShort = listMonthsShort;
    hooks.weekdaysMin = listWeekdaysMin;
    hooks.defineLocale = defineLocale;
    hooks.updateLocale = updateLocale;
    hooks.locales = listLocales;
    hooks.weekdaysShort = listWeekdaysShort;
    hooks.normalizeUnits = normalizeUnits;
    hooks.relativeTimeRounding = getSetRelativeTimeRounding;
    hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
    hooks.calendarFormat = getCalendarFormat;
    hooks.prototype = proto;

    // currently HTML5 input type only supports 24-hour formats
    hooks.HTML5_FMT = {
        DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm', // <input type="datetime-local" />
        DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss', // <input type="datetime-local" step="1" />
        DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS', // <input type="datetime-local" step="0.001" />
        DATE: 'YYYY-MM-DD', // <input type="date" />
        TIME: 'HH:mm', // <input type="time" />
        TIME_SECONDS: 'HH:mm:ss', // <input type="time" step="1" />
        TIME_MS: 'HH:mm:ss.SSS', // <input type="time" step="0.001" />
        WEEK: 'GGGG-[W]WW', // <input type="week" />
        MONTH: 'YYYY-MM', // <input type="month" />
    };

    //! moment.js locale configuration

    hooks.defineLocale('af', {
        months: 'Januarie_Februarie_Maart_April_Mei_Junie_Julie_Augustus_September_Oktober_November_Desember'.split(
            '_'
        ),
        monthsShort: 'Jan_Feb_Mrt_Apr_Mei_Jun_Jul_Aug_Sep_Okt_Nov_Des'.split('_'),
        weekdays: 'Sondag_Maandag_Dinsdag_Woensdag_Donderdag_Vrydag_Saterdag'.split(
            '_'
        ),
        weekdaysShort: 'Son_Maa_Din_Woe_Don_Vry_Sat'.split('_'),
        weekdaysMin: 'So_Ma_Di_Wo_Do_Vr_Sa'.split('_'),
        meridiemParse: /vm|nm/i,
        isPM: function (input) {
            return /^nm$/i.test(input);
        },
        meridiem: function (hours, minutes, isLower) {
            if (hours < 12) {
                return isLower ? 'vm' : 'VM';
            } else {
                return isLower ? 'nm' : 'NM';
            }
        },
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Vandag om] LT',
            nextDay: '[M척re om] LT',
            nextWeek: 'dddd [om] LT',
            lastDay: '[Gister om] LT',
            lastWeek: '[Laas] dddd [om] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'oor %s',
            past: '%s gelede',
            s: "'n paar sekondes",
            ss: '%d sekondes',
            m: "'n minuut",
            mm: '%d minute',
            h: "'n uur",
            hh: '%d ure',
            d: "'n dag",
            dd: '%d dae',
            M: "'n maand",
            MM: '%d maande',
            y: "'n jaar",
            yy: '%d jaar',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(ste|de)/,
        ordinal: function (number) {
            return (
                number +
                (number === 1 || number === 8 || number >= 20 ? 'ste' : 'de')
            ); // Thanks to Joris R철ling : https://github.com/jjupiter
        },
        week: {
            dow: 1, // Maandag is die eerste dag van die week.
            doy: 4, // Die week wat die 4de Januarie bevat is die eerste week van die jaar.
        },
    });

    //! moment.js locale configuration

    var pluralForm = function (n) {
            return n === 0
                ? 0
                : n === 1
                    ? 1
                    : n === 2
                        ? 2
                        : n % 100 >= 3 && n % 100 <= 10
                            ? 3
                            : n % 100 >= 11
                                ? 4
                                : 5;
        },
        plurals = {
            s: [
                '粒�� �� 麻碼��馬',
                '麻碼��馬 �碼幕膜馬',
                ['麻碼��魔碼�', '麻碼��魔��'],
                '%d 麻�碼�',
                '%d 麻碼��馬',
                '%d 麻碼��馬',
            ],
            m: [
                '粒�� �� 膜���馬',
                '膜���馬 �碼幕膜馬',
                ['膜���魔碼�', '膜���魔��'],
                '%d 膜�碼痲�',
                '%d 膜���馬',
                '%d 膜���馬',
            ],
            h: [
                '粒�� �� 卍碼晩馬',
                '卍碼晩馬 �碼幕膜馬',
                ['卍碼晩魔碼�', '卍碼晩魔��'],
                '%d 卍碼晩碼魔',
                '%d 卍碼晩馬',
                '%d 卍碼晩馬',
            ],
            d: [
                '粒�� �� ���',
                '��� �碼幕膜',
                ['���碼�', '�����'],
                '%d 粒�碼�',
                '%d ����碼',
                '%d ���',
            ],
            M: [
                '粒�� �� 娩�邈',
                '娩�邈 �碼幕膜',
                ['娩�邈碼�', '娩�邈��'],
                '%d 粒娩�邈',
                '%d 娩�邈碼',
                '%d 娩�邈',
            ],
            y: [
                '粒�� �� 晩碼�',
                '晩碼� �碼幕膜',
                ['晩碼�碼�', '晩碼���'],
                '%d 粒晩�碼�',
                '%d 晩碼��碼',
                '%d 晩碼�',
            ],
        },
        pluralize = function (u) {
            return function (number, withoutSuffix, string, isFuture) {
                var f = pluralForm(number),
                    str = plurals[u][pluralForm(number)];
                if (f === 2) {
                    str = str[withoutSuffix ? 0 : 1];
                }
                return str.replace(/%d/i, number);
            };
        },
        months$1 = [
            '寞碼���',
            '���邈�',
            '�碼邈卍',
            '粒�邈��',
            '�碼�',
            '寞�碼�',
            '寞����馬',
            '粒�魔',
            '卍磨魔�磨邈',
            '粒�魔�磨邈',
            '����磨邈',
            '膜�卍�磨邈',
        ];

    hooks.defineLocale('ar-dz', {
        months: months$1,
        monthsShort: months$1,
        weekdays: '碼�粒幕膜_碼�瑪麻���_碼�麻�碼麻碼立_碼�粒邈磨晩碼立_碼�漠��卍_碼�寞�晩馬_碼�卍磨魔'.split('_'),
        weekdaysShort: '粒幕膜_瑪麻���_麻�碼麻碼立_粒邈磨晩碼立_漠��卍_寞�晩馬_卍磨魔'.split('_'),
        weekdaysMin: '幕_�_麻_邈_漠_寞_卍'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'D/\u200FM/\u200FYYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        meridiemParse: /巒|�/,
        isPM: function (input) {
            return '�' === input;
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 12) {
                return '巒';
            } else {
                return '�';
            }
        },
        calendar: {
            sameDay: '[碼���� 晩�膜 碼�卍碼晩馬] LT',
            nextDay: '[曼膜�碼 晩�膜 碼�卍碼晩馬] LT',
            nextWeek: 'dddd [晩�膜 碼�卍碼晩馬] LT',
            lastDay: '[粒�卍 晩�膜 碼�卍碼晩馬] LT',
            lastWeek: 'dddd [晩�膜 碼�卍碼晩馬] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '磨晩膜 %s',
            past: '��莫 %s',
            s: pluralize('s'),
            ss: pluralize('s'),
            m: pluralize('m'),
            mm: pluralize('m'),
            h: pluralize('h'),
            hh: pluralize('h'),
            d: pluralize('d'),
            dd: pluralize('d'),
            M: pluralize('M'),
            MM: pluralize('M'),
            y: pluralize('y'),
            yy: pluralize('y'),
        },
        postformat: function (string) {
            return string.replace(/,/g, '�');
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('ar-kw', {
        months: '��碼�邈_�磨邈碼�邈_�碼邈卍_粒磨邈��_�碼�_�����_�����万_曼娩魔_娩魔�磨邈_粒�魔�磨邈_���磨邈_膜寞�磨邈'.split(
            '_'
        ),
        monthsShort: '��碼�邈_�磨邈碼�邈_�碼邈卍_粒磨邈��_�碼�_�����_�����万_曼娩魔_娩魔�磨邈_粒�魔�磨邈_���磨邈_膜寞�磨邈'.split(
            '_'
        ),
        weekdays: '碼�粒幕膜_碼�瑪魔���_碼�麻�碼麻碼立_碼�粒邈磨晩碼立_碼�漠��卍_碼�寞�晩馬_碼�卍磨魔'.split('_'),
        weekdaysShort: '碼幕膜_碼魔���_麻�碼麻碼立_碼邈磨晩碼立_漠��卍_寞�晩馬_卍磨魔'.split('_'),
        weekdaysMin: '幕_�_麻_邈_漠_寞_卍'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[碼���� 晩�� 碼�卍碼晩馬] LT',
            nextDay: '[曼膜碼 晩�� 碼�卍碼晩馬] LT',
            nextWeek: 'dddd [晩�� 碼�卍碼晩馬] LT',
            lastDay: '[粒�卍 晩�� 碼�卍碼晩馬] LT',
            lastWeek: 'dddd [晩�� 碼�卍碼晩馬] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '�� %s',
            past: '��莫 %s',
            s: '麻�碼�',
            ss: '%d 麻碼��馬',
            m: '膜���馬',
            mm: '%d 膜�碼痲�',
            h: '卍碼晩馬',
            hh: '%d 卍碼晩碼魔',
            d: '���',
            dd: '%d 粒�碼�',
            M: '娩�邈',
            MM: '%d 粒娩�邈',
            y: '卍�馬',
            yy: '%d 卍��碼魔',
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 12, // The week that contains Jan 12th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var symbolMap = {
            1: '1',
            2: '2',
            3: '3',
            4: '4',
            5: '5',
            6: '6',
            7: '7',
            8: '8',
            9: '9',
            0: '0',
        },
        pluralForm$1 = function (n) {
            return n === 0
                ? 0
                : n === 1
                    ? 1
                    : n === 2
                        ? 2
                        : n % 100 >= 3 && n % 100 <= 10
                            ? 3
                            : n % 100 >= 11
                                ? 4
                                : 5;
        },
        plurals$1 = {
            s: [
                '粒�� �� 麻碼��馬',
                '麻碼��馬 �碼幕膜馬',
                ['麻碼��魔碼�', '麻碼��魔��'],
                '%d 麻�碼�',
                '%d 麻碼��馬',
                '%d 麻碼��馬',
            ],
            m: [
                '粒�� �� 膜���馬',
                '膜���馬 �碼幕膜馬',
                ['膜���魔碼�', '膜���魔��'],
                '%d 膜�碼痲�',
                '%d 膜���馬',
                '%d 膜���馬',
            ],
            h: [
                '粒�� �� 卍碼晩馬',
                '卍碼晩馬 �碼幕膜馬',
                ['卍碼晩魔碼�', '卍碼晩魔��'],
                '%d 卍碼晩碼魔',
                '%d 卍碼晩馬',
                '%d 卍碼晩馬',
            ],
            d: [
                '粒�� �� ���',
                '��� �碼幕膜',
                ['���碼�', '�����'],
                '%d 粒�碼�',
                '%d ����碼',
                '%d ���',
            ],
            M: [
                '粒�� �� 娩�邈',
                '娩�邈 �碼幕膜',
                ['娩�邈碼�', '娩�邈��'],
                '%d 粒娩�邈',
                '%d 娩�邈碼',
                '%d 娩�邈',
            ],
            y: [
                '粒�� �� 晩碼�',
                '晩碼� �碼幕膜',
                ['晩碼�碼�', '晩碼���'],
                '%d 粒晩�碼�',
                '%d 晩碼��碼',
                '%d 晩碼�',
            ],
        },
        pluralize$1 = function (u) {
            return function (number, withoutSuffix, string, isFuture) {
                var f = pluralForm$1(number),
                    str = plurals$1[u][pluralForm$1(number)];
                if (f === 2) {
                    str = str[withoutSuffix ? 0 : 1];
                }
                return str.replace(/%d/i, number);
            };
        },
        months$2 = [
            '��碼�邈',
            '�磨邈碼�邈',
            '�碼邈卍',
            '粒磨邈��',
            '�碼��',
            '�����',
            '�����',
            '粒曼卍慢卍',
            '卍磨魔�磨邈',
            '粒�魔�磨邈',
            '����磨邈',
            '膜�卍�磨邈',
        ];

    hooks.defineLocale('ar-ly', {
        months: months$2,
        monthsShort: months$2,
        weekdays: '碼�粒幕膜_碼�瑪麻���_碼�麻�碼麻碼立_碼�粒邈磨晩碼立_碼�漠��卍_碼�寞�晩馬_碼�卍磨魔'.split('_'),
        weekdaysShort: '粒幕膜_瑪麻���_麻�碼麻碼立_粒邈磨晩碼立_漠��卍_寞�晩馬_卍磨魔'.split('_'),
        weekdaysMin: '幕_�_麻_邈_漠_寞_卍'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'D/\u200FM/\u200FYYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        meridiemParse: /巒|�/,
        isPM: function (input) {
            return '�' === input;
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 12) {
                return '巒';
            } else {
                return '�';
            }
        },
        calendar: {
            sameDay: '[碼���� 晩�膜 碼�卍碼晩馬] LT',
            nextDay: '[曼膜�碼 晩�膜 碼�卍碼晩馬] LT',
            nextWeek: 'dddd [晩�膜 碼�卍碼晩馬] LT',
            lastDay: '[粒�卍 晩�膜 碼�卍碼晩馬] LT',
            lastWeek: 'dddd [晩�膜 碼�卍碼晩馬] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '磨晩膜 %s',
            past: '��莫 %s',
            s: pluralize$1('s'),
            ss: pluralize$1('s'),
            m: pluralize$1('m'),
            mm: pluralize$1('m'),
            h: pluralize$1('h'),
            hh: pluralize$1('h'),
            d: pluralize$1('d'),
            dd: pluralize$1('d'),
            M: pluralize$1('M'),
            MM: pluralize$1('M'),
            y: pluralize$1('y'),
            yy: pluralize$1('y'),
        },
        preparse: function (string) {
            return string.replace(/�/g, ',');
        },
        postformat: function (string) {
            return string
                .replace(/\d/g, function (match) {
                    return symbolMap[match];
                })
                .replace(/,/g, '�');
        },
        week: {
            dow: 6, // Saturday is the first day of the week.
            doy: 12, // The week that contains Jan 12th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('ar-ma', {
        months: '��碼�邈_�磨邈碼�邈_�碼邈卍_粒磨邈��_�碼�_�����_�����万_曼娩魔_娩魔�磨邈_粒�魔�磨邈_���磨邈_膜寞�磨邈'.split(
            '_'
        ),
        monthsShort: '��碼�邈_�磨邈碼�邈_�碼邈卍_粒磨邈��_�碼�_�����_�����万_曼娩魔_娩魔�磨邈_粒�魔�磨邈_���磨邈_膜寞�磨邈'.split(
            '_'
        ),
        weekdays: '碼�粒幕膜_碼�瑪麻���_碼�麻�碼麻碼立_碼�粒邈磨晩碼立_碼�漠��卍_碼�寞�晩馬_碼�卍磨魔'.split('_'),
        weekdaysShort: '碼幕膜_碼麻���_麻�碼麻碼立_碼邈磨晩碼立_漠��卍_寞�晩馬_卍磨魔'.split('_'),
        weekdaysMin: '幕_�_麻_邈_漠_寞_卍'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[碼���� 晩�� 碼�卍碼晩馬] LT',
            nextDay: '[曼膜碼 晩�� 碼�卍碼晩馬] LT',
            nextWeek: 'dddd [晩�� 碼�卍碼晩馬] LT',
            lastDay: '[粒�卍 晩�� 碼�卍碼晩馬] LT',
            lastWeek: 'dddd [晩�� 碼�卍碼晩馬] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '�� %s',
            past: '��莫 %s',
            s: '麻�碼�',
            ss: '%d 麻碼��馬',
            m: '膜���馬',
            mm: '%d 膜�碼痲�',
            h: '卍碼晩馬',
            hh: '%d 卍碼晩碼魔',
            d: '���',
            dd: '%d 粒�碼�',
            M: '娩�邈',
            MM: '%d 粒娩�邈',
            y: '卍�馬',
            yy: '%d 卍��碼魔',
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var symbolMap$1 = {
            1: '蔑',
            2: '冥',
            3: '名',
            4: '命',
            5: '明',
            6: '暝',
            7: '椧',
            8: '溟',
            9: '皿',
            0: '�',
        },
        numberMap = {
            '蔑': '1',
            '冥': '2',
            '名': '3',
            '命': '4',
            '明': '5',
            '暝': '6',
            '椧': '7',
            '溟': '8',
            '皿': '9',
            '�': '0',
        };

    hooks.defineLocale('ar-sa', {
        months: '��碼�邈_�磨邈碼�邈_�碼邈卍_粒磨邈��_�碼��_�����_�����_粒曼卍慢卍_卍磨魔�磨邈_粒�魔�磨邈_����磨邈_膜�卍�磨邈'.split(
            '_'
        ),
        monthsShort: '��碼�邈_�磨邈碼�邈_�碼邈卍_粒磨邈��_�碼��_�����_�����_粒曼卍慢卍_卍磨魔�磨邈_粒�魔�磨邈_����磨邈_膜�卍�磨邈'.split(
            '_'
        ),
        weekdays: '碼�粒幕膜_碼�瑪麻���_碼�麻�碼麻碼立_碼�粒邈磨晩碼立_碼�漠��卍_碼�寞�晩馬_碼�卍磨魔'.split('_'),
        weekdaysShort: '粒幕膜_瑪麻���_麻�碼麻碼立_粒邈磨晩碼立_漠��卍_寞�晩馬_卍磨魔'.split('_'),
        weekdaysMin: '幕_�_麻_邈_漠_寞_卍'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        meridiemParse: /巒|�/,
        isPM: function (input) {
            return '�' === input;
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 12) {
                return '巒';
            } else {
                return '�';
            }
        },
        calendar: {
            sameDay: '[碼���� 晩�� 碼�卍碼晩馬] LT',
            nextDay: '[曼膜碼 晩�� 碼�卍碼晩馬] LT',
            nextWeek: 'dddd [晩�� 碼�卍碼晩馬] LT',
            lastDay: '[粒�卍 晩�� 碼�卍碼晩馬] LT',
            lastWeek: 'dddd [晩�� 碼�卍碼晩馬] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '�� %s',
            past: '��莫 %s',
            s: '麻�碼�',
            ss: '%d 麻碼��馬',
            m: '膜���馬',
            mm: '%d 膜�碼痲�',
            h: '卍碼晩馬',
            hh: '%d 卍碼晩碼魔',
            d: '���',
            dd: '%d 粒�碼�',
            M: '娩�邈',
            MM: '%d 粒娩�邈',
            y: '卍�馬',
            yy: '%d 卍��碼魔',
        },
        preparse: function (string) {
            return string
                .replace(/[蔑冥名命明暝椧溟皿�]/g, function (match) {
                    return numberMap[match];
                })
                .replace(/�/g, ',');
        },
        postformat: function (string) {
            return string
                .replace(/\d/g, function (match) {
                    return symbolMap$1[match];
                })
                .replace(/,/g, '�');
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 6, // The week that contains Jan 6th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('ar-tn', {
        months: '寞碼���_���邈�_�碼邈卍_粒�邈��_�碼�_寞�碼�_寞����馬_粒�魔_卍磨魔�磨邈_粒�魔�磨邈_����磨邈_膜�卍�磨邈'.split(
            '_'
        ),
        monthsShort: '寞碼���_���邈�_�碼邈卍_粒�邈��_�碼�_寞�碼�_寞����馬_粒�魔_卍磨魔�磨邈_粒�魔�磨邈_����磨邈_膜�卍�磨邈'.split(
            '_'
        ),
        weekdays: '碼�粒幕膜_碼�瑪麻���_碼�麻�碼麻碼立_碼�粒邈磨晩碼立_碼�漠��卍_碼�寞�晩馬_碼�卍磨魔'.split('_'),
        weekdaysShort: '粒幕膜_瑪麻���_麻�碼麻碼立_粒邈磨晩碼立_漠��卍_寞�晩馬_卍磨魔'.split('_'),
        weekdaysMin: '幕_�_麻_邈_漠_寞_卍'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[碼���� 晩�� 碼�卍碼晩馬] LT',
            nextDay: '[曼膜碼 晩�� 碼�卍碼晩馬] LT',
            nextWeek: 'dddd [晩�� 碼�卍碼晩馬] LT',
            lastDay: '[粒�卍 晩�� 碼�卍碼晩馬] LT',
            lastWeek: 'dddd [晩�� 碼�卍碼晩馬] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '�� %s',
            past: '��莫 %s',
            s: '麻�碼�',
            ss: '%d 麻碼��馬',
            m: '膜���馬',
            mm: '%d 膜�碼痲�',
            h: '卍碼晩馬',
            hh: '%d 卍碼晩碼魔',
            d: '���',
            dd: '%d 粒�碼�',
            M: '娩�邈',
            MM: '%d 粒娩�邈',
            y: '卍�馬',
            yy: '%d 卍��碼魔',
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var symbolMap$2 = {
            1: '蔑',
            2: '冥',
            3: '名',
            4: '命',
            5: '明',
            6: '暝',
            7: '椧',
            8: '溟',
            9: '皿',
            0: '�',
        },
        numberMap$1 = {
            '蔑': '1',
            '冥': '2',
            '名': '3',
            '命': '4',
            '明': '5',
            '暝': '6',
            '椧': '7',
            '溟': '8',
            '皿': '9',
            '�': '0',
        },
        pluralForm$2 = function (n) {
            return n === 0
                ? 0
                : n === 1
                    ? 1
                    : n === 2
                        ? 2
                        : n % 100 >= 3 && n % 100 <= 10
                            ? 3
                            : n % 100 >= 11
                                ? 4
                                : 5;
        },
        plurals$2 = {
            s: [
                '粒�� �� 麻碼��馬',
                '麻碼��馬 �碼幕膜馬',
                ['麻碼��魔碼�', '麻碼��魔��'],
                '%d 麻�碼�',
                '%d 麻碼��馬',
                '%d 麻碼��馬',
            ],
            m: [
                '粒�� �� 膜���馬',
                '膜���馬 �碼幕膜馬',
                ['膜���魔碼�', '膜���魔��'],
                '%d 膜�碼痲�',
                '%d 膜���馬',
                '%d 膜���馬',
            ],
            h: [
                '粒�� �� 卍碼晩馬',
                '卍碼晩馬 �碼幕膜馬',
                ['卍碼晩魔碼�', '卍碼晩魔��'],
                '%d 卍碼晩碼魔',
                '%d 卍碼晩馬',
                '%d 卍碼晩馬',
            ],
            d: [
                '粒�� �� ���',
                '��� �碼幕膜',
                ['���碼�', '�����'],
                '%d 粒�碼�',
                '%d ����碼',
                '%d ���',
            ],
            M: [
                '粒�� �� 娩�邈',
                '娩�邈 �碼幕膜',
                ['娩�邈碼�', '娩�邈��'],
                '%d 粒娩�邈',
                '%d 娩�邈碼',
                '%d 娩�邈',
            ],
            y: [
                '粒�� �� 晩碼�',
                '晩碼� �碼幕膜',
                ['晩碼�碼�', '晩碼���'],
                '%d 粒晩�碼�',
                '%d 晩碼��碼',
                '%d 晩碼�',
            ],
        },
        pluralize$2 = function (u) {
            return function (number, withoutSuffix, string, isFuture) {
                var f = pluralForm$2(number),
                    str = plurals$2[u][pluralForm$2(number)];
                if (f === 2) {
                    str = str[withoutSuffix ? 0 : 1];
                }
                return str.replace(/%d/i, number);
            };
        },
        months$3 = [
            '��碼�邈',
            '�磨邈碼�邈',
            '�碼邈卍',
            '粒磨邈��',
            '�碼��',
            '�����',
            '�����',
            '粒曼卍慢卍',
            '卍磨魔�磨邈',
            '粒�魔�磨邈',
            '����磨邈',
            '膜�卍�磨邈',
        ];

    hooks.defineLocale('ar', {
        months: months$3,
        monthsShort: months$3,
        weekdays: '碼�粒幕膜_碼�瑪麻���_碼�麻�碼麻碼立_碼�粒邈磨晩碼立_碼�漠��卍_碼�寞�晩馬_碼�卍磨魔'.split('_'),
        weekdaysShort: '粒幕膜_瑪麻���_麻�碼麻碼立_粒邈磨晩碼立_漠��卍_寞�晩馬_卍磨魔'.split('_'),
        weekdaysMin: '幕_�_麻_邈_漠_寞_卍'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'D/\u200FM/\u200FYYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        meridiemParse: /巒|�/,
        isPM: function (input) {
            return '�' === input;
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 12) {
                return '巒';
            } else {
                return '�';
            }
        },
        calendar: {
            sameDay: '[碼���� 晩�膜 碼�卍碼晩馬] LT',
            nextDay: '[曼膜�碼 晩�膜 碼�卍碼晩馬] LT',
            nextWeek: 'dddd [晩�膜 碼�卍碼晩馬] LT',
            lastDay: '[粒�卍 晩�膜 碼�卍碼晩馬] LT',
            lastWeek: 'dddd [晩�膜 碼�卍碼晩馬] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '磨晩膜 %s',
            past: '��莫 %s',
            s: pluralize$2('s'),
            ss: pluralize$2('s'),
            m: pluralize$2('m'),
            mm: pluralize$2('m'),
            h: pluralize$2('h'),
            hh: pluralize$2('h'),
            d: pluralize$2('d'),
            dd: pluralize$2('d'),
            M: pluralize$2('M'),
            MM: pluralize$2('M'),
            y: pluralize$2('y'),
            yy: pluralize$2('y'),
        },
        preparse: function (string) {
            return string
                .replace(/[蔑冥名命明暝椧溟皿�]/g, function (match) {
                    return numberMap$1[match];
                })
                .replace(/�/g, ',');
        },
        postformat: function (string) {
            return string
                .replace(/\d/g, function (match) {
                    return symbolMap$2[match];
                })
                .replace(/,/g, '�');
        },
        week: {
            dow: 6, // Saturday is the first day of the week.
            doy: 12, // The week that contains Jan 12th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var suffixes = {
        1: '-inci',
        5: '-inci',
        8: '-inci',
        70: '-inci',
        80: '-inci',
        2: '-nci',
        7: '-nci',
        20: '-nci',
        50: '-nci',
        3: '-체nc체',
        4: '-체nc체',
        100: '-체nc체',
        6: '-nc캇',
        9: '-uncu',
        10: '-uncu',
        30: '-uncu',
        60: '-캇nc캇',
        90: '-캇nc캇',
    };

    hooks.defineLocale('az', {
        months: 'yanvar_fevral_mart_aprel_may_iyun_iyul_avqust_sentyabr_oktyabr_noyabr_dekabr'.split(
            '_'
        ),
        monthsShort: 'yan_fev_mar_apr_may_iyn_iyl_avq_sen_okt_noy_dek'.split('_'),
        weekdays: 'Bazar_Bazar ert�si_횉�r힊�nb� ax힊am캇_횉�r힊�nb�_C체m� ax힊am캇_C체m�_힇�nb�'.split(
            '_'
        ),
        weekdaysShort: 'Baz_BzE_횉Ax_횉�r_CAx_C체m_힇�n'.split('_'),
        weekdaysMin: 'Bz_BE_횉A_횉�_CA_C체_힇�'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[bug체n saat] LT',
            nextDay: '[sabah saat] LT',
            nextWeek: '[g�l�n h�ft�] dddd [saat] LT',
            lastDay: '[d체n�n] LT',
            lastWeek: '[ke챌�n h�ft�] dddd [saat] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s sonra',
            past: '%s �vv�l',
            s: 'bir ne챌� saniy�',
            ss: '%d saniy�',
            m: 'bir d�qiq�',
            mm: '%d d�qiq�',
            h: 'bir saat',
            hh: '%d saat',
            d: 'bir g체n',
            dd: '%d g체n',
            M: 'bir ay',
            MM: '%d ay',
            y: 'bir il',
            yy: '%d il',
        },
        meridiemParse: /gec�|s�h�r|g체nd체z|ax힊am/,
        isPM: function (input) {
            return /^(g체nd체z|ax힊am)$/.test(input);
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 4) {
                return 'gec�';
            } else if (hour < 12) {
                return 's�h�r';
            } else if (hour < 17) {
                return 'g체nd체z';
            } else {
                return 'ax힊am';
            }
        },
        dayOfMonthOrdinalParse: /\d{1,2}-(캇nc캇|inci|nci|체nc체|nc캇|uncu)/,
        ordinal: function (number) {
            if (number === 0) {
                // special case for zero
                return number + '-캇nc캇';
            }
            var a = number % 10,
                b = (number % 100) - a,
                c = number >= 100 ? 100 : null;
            return number + (suffixes[a] || suffixes[b] || suffixes[c]);
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    function plural(word, num) {
        var forms = word.split('_');
        return num % 10 === 1 && num % 100 !== 11
            ? forms[0]
            : num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20)
                ? forms[1]
                : forms[2];
    }
    function relativeTimeWithPlural(number, withoutSuffix, key) {
        var format = {
            ss: withoutSuffix ? '�筠克�戟畇逵_�筠克�戟畇�_�筠克�戟畇' : '�筠克�戟畇�_�筠克�戟畇�_�筠克�戟畇',
            mm: withoutSuffix ? '�勻�剋�戟逵_�勻�剋�戟�_�勻�剋�戟' : '�勻�剋�戟�_�勻�剋�戟�_�勻�剋�戟',
            hh: withoutSuffix ? '均逵畇鈞�戟逵_均逵畇鈞�戟�_均逵畇鈞�戟' : '均逵畇鈞�戟�_均逵畇鈞�戟�_均逵畇鈞�戟',
            dd: '畇鈞筠戟�_畇戟�_畇鈞�戟',
            MM: '劇筠���_劇筠����_劇筠���逵�',
            yy: '均棘畇_均逵畇�_均逵畇棘�',
        };
        if (key === 'm') {
            return withoutSuffix ? '�勻�剋�戟逵' : '�勻�剋�戟�';
        } else if (key === 'h') {
            return withoutSuffix ? '均逵畇鈞�戟逵' : '均逵畇鈞�戟�';
        } else {
            return number + ' ' + plural(format[key], +number);
        }
    }

    hooks.defineLocale('be', {
        months: {
            format: '���畇鈞筠戟�_剋��逵均逵_�逵克逵勻�克逵_克�逵�逵勻�克逵_��逵�戟�_���勻筠戟�_剋�極筠戟�_菌戟��戟�_勻筠�逵�戟�_克逵�����戟�克逵_剋���逵極逵畇逵_�戟筠菌戟�'.split(
                '_'
            ),
            standalone: '���畇鈞筠戟�_剋���_�逵克逵勻�克_克�逵�逵勻�克_��逵勻筠戟�_���勻筠戟�_剋�極筠戟�_菌戟�勻筠戟�_勻筠�逵�筠戟�_克逵�����戟�克_剋���逵極逵畇_�戟筠菌逵戟�'.split(
                '_'
            ),
        },
        monthsShort: '���畇_剋��_�逵克_克�逵�_��逵勻_���勻_剋�極_菌戟�勻_勻筠�_克逵��_剋���_�戟筠菌'.split(
            '_'
        ),
        weekdays: {
            format: '戟�畇鈞筠剋�_極逵戟�畇鈞筠剋逵克_逵��棘�逵克_�筠�逵畇�_�逵�勻筠�_極��戟���_��閨棘��'.split(
                '_'
            ),
            standalone: '戟�畇鈞筠剋�_極逵戟�畇鈞筠剋逵克_逵��棘�逵克_�筠�逵畇逵_�逵�勻筠�_極��戟��逵_��閨棘�逵'.split(
                '_'
            ),
            isFormat: /\[ ?[叫��] ?(?:劇�戟�剋��|戟逵���極戟��)? ?\] ?dddd/,
        },
        weekdaysShort: '戟畇_極戟_逵�_��_��_極�_�閨'.split('_'),
        weekdaysMin: '戟畇_極戟_逵�_��_��_極�_�閨'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D MMMM YYYY 均.',
            LLL: 'D MMMM YYYY 均., HH:mm',
            LLLL: 'dddd, D MMMM YYYY 均., HH:mm',
        },
        calendar: {
            sameDay: '[鬼�戟戟� �] LT',
            nextDay: '[�逵���逵 �] LT',
            lastDay: '[叫�棘�逵 �] LT',
            nextWeek: function () {
                return '[叫] dddd [�] LT';
            },
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                    case 3:
                    case 5:
                    case 6:
                        return '[叫 劇�戟�剋��] dddd [�] LT';
                    case 1:
                    case 2:
                    case 4:
                        return '[叫 劇�戟�剋�] dddd [�] LT';
                }
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: '極�逵鈞 %s',
            past: '%s �逵劇�',
            s: '戟筠克逵剋�克� �筠克�戟畇',
            m: relativeTimeWithPlural,
            mm: relativeTimeWithPlural,
            h: relativeTimeWithPlural,
            hh: relativeTimeWithPlural,
            d: '畇鈞筠戟�',
            dd: relativeTimeWithPlural,
            M: '劇筠���',
            MM: relativeTimeWithPlural,
            y: '均棘畇',
            yy: relativeTimeWithPlural,
        },
        meridiemParse: /戟棘��|�逵戟���|畇戟�|勻筠�逵�逵/,
        isPM: function (input) {
            return /^(畇戟�|勻筠�逵�逵)$/.test(input);
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 4) {
                return '戟棘��';
            } else if (hour < 12) {
                return '�逵戟���';
            } else if (hour < 17) {
                return '畇戟�';
            } else {
                return '勻筠�逵�逵';
            }
        },
        dayOfMonthOrdinalParse: /\d{1,2}-(�|�|均逵)/,
        ordinal: function (number, period) {
            switch (period) {
                case 'M':
                case 'd':
                case 'DDD':
                case 'w':
                case 'W':
                    return (number % 10 === 2 || number % 10 === 3) &&
                    number % 100 !== 12 &&
                    number % 100 !== 13
                        ? number + '-�'
                        : number + '-�';
                case 'D':
                    return number + '-均逵';
                default:
                    return number;
            }
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('bg', {
        months: '�戟�逵�龜_�筠勻��逵�龜_劇逵��_逵極�龜剋_劇逵橘_�戟龜_�剋龜_逵勻均���_�筠極�筠劇勻�龜_棘克�棘劇勻�龜_戟棘筠劇勻�龜_畇筠克筠劇勻�龜'.split(
            '_'
        ),
        monthsShort: '�戟�_�筠勻_劇逵�_逵極�_劇逵橘_�戟龜_�剋龜_逵勻均_�筠極_棘克�_戟棘筠_畇筠克'.split('_'),
        weekdays: '戟筠畇筠剋�_極棘戟筠畇筠剋戟龜克_勻�棘�戟龜克_���畇逵_�筠�勻����克_極筠��克_��閨棘�逵'.split(
            '_'
        ),
        weekdaysShort: '戟筠畇_極棘戟_勻�棘_���_�筠�_極筠�_��閨'.split('_'),
        weekdaysMin: '戟畇_極戟_勻�_��_��_極�_�閨'.split('_'),
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'D.MM.YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY H:mm',
            LLLL: 'dddd, D MMMM YYYY H:mm',
        },
        calendar: {
            sameDay: '[�戟筠� 勻] LT',
            nextDay: '[叫��筠 勻] LT',
            nextWeek: 'dddd [勻] LT',
            lastDay: '[��筠�逵 勻] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                    case 3:
                    case 6:
                        return '[�龜戟逵剋逵�逵] dddd [勻] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[�龜戟逵剋龜�] dddd [勻] LT';
                }
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: '�剋筠畇 %s',
            past: '極�筠畇龜 %s',
            s: '戟�克棘剋克棘 �筠克�戟畇龜',
            ss: '%d �筠克�戟畇龜',
            m: '劇龜戟��逵',
            mm: '%d 劇龜戟��龜',
            h: '�逵�',
            hh: '%d �逵�逵',
            d: '畇筠戟',
            dd: '%d 畇筠戟逵',
            w: '�筠畇劇龜�逵',
            ww: '%d �筠畇劇龜�龜',
            M: '劇筠�筠�',
            MM: '%d 劇筠�筠�逵',
            y: '均棘畇龜戟逵',
            yy: '%d 均棘畇龜戟龜',
        },
        dayOfMonthOrdinalParse: /\d{1,2}-(筠勻|筠戟|�龜|勻龜|�龜|劇龜)/,
        ordinal: function (number) {
            var lastDigit = number % 10,
                last2Digits = number % 100;
            if (number === 0) {
                return number + '-筠勻';
            } else if (last2Digits === 0) {
                return number + '-筠戟';
            } else if (last2Digits > 10 && last2Digits < 20) {
                return number + '-�龜';
            } else if (lastDigit === 1) {
                return number + '-勻龜';
            } else if (lastDigit === 2) {
                return number + '-�龜';
            } else if (lastDigit === 7 || lastDigit === 8) {
                return number + '-劇龜';
            } else {
                return number + '-�龜';
            }
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('bm', {
        months: 'Zanwuyekalo_Fewuruyekalo_Marisikalo_Awirilikalo_M�kalo_Zuw�nkalo_Zuluyekalo_Utikalo_S�tanburukalo_�kut�burukalo_Nowanburukalo_Desanburukalo'.split(
            '_'
        ),
        monthsShort: 'Zan_Few_Mar_Awi_M�_Zuw_Zul_Uti_S�t_�ku_Now_Des'.split('_'),
        weekdays: 'Kari_Nt�n�n_Tarata_Araba_Alamisa_Juma_Sibiri'.split('_'),
        weekdaysShort: 'Kar_Nt�_Tar_Ara_Ala_Jum_Sib'.split('_'),
        weekdaysMin: 'Ka_Nt_Ta_Ar_Al_Ju_Si'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'MMMM [tile] D [san] YYYY',
            LLL: 'MMMM [tile] D [san] YYYY [l�r�] HH:mm',
            LLLL: 'dddd MMMM [tile] D [san] YYYY [l�r�] HH:mm',
        },
        calendar: {
            sameDay: '[Bi l�r�] LT',
            nextDay: '[Sini l�r�] LT',
            nextWeek: 'dddd [don l�r�] LT',
            lastDay: '[Kunu l�r�] LT',
            lastWeek: 'dddd [t�m�nen l�r�] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s k�n�',
            past: 'a b� %s b�',
            s: 'sanga dama dama',
            ss: 'sekondi %d',
            m: 'miniti kelen',
            mm: 'miniti %d',
            h: 'l�r� kelen',
            hh: 'l�r� %d',
            d: 'tile kelen',
            dd: 'tile %d',
            M: 'kalo kelen',
            MM: 'kalo %d',
            y: 'san kelen',
            yy: 'san %d',
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var symbolMap$3 = {
            1: '鋤�',
            2: '鋤�',
            3: '鋤�',
            4: '鋤�',
            5: '鋤�',
            6: '鋤�',
            7: '鋤�',
            8: '鋤�',
            9: '鋤�',
            0: '鋤�',
        },
        numberMap$2 = {
            '鋤�': '1',
            '鋤�': '2',
            '鋤�': '3',
            '鋤�': '4',
            '鋤�': '5',
            '鋤�': '6',
            '鋤�': '7',
            '鋤�': '8',
            '鋤�': '9',
            '鋤�': '0',
        };

    hooks.defineLocale('bn-bd', {
        months: '逝쒉┥逝ⓣ쭅鋤잀┥逝겯┸_逝ム쭎逝о쭕逝겯쭅鋤잀┥逝겯┸_逝�┥逝겯쭕逝�_逝뤲┴鋤띭┛逝욈┣_逝�쭎_逝쒉쭅逝�_逝쒉쭅逝꿋┥逝�_逝녱쬀逝멘쭕逝�_逝멘쭎逝む쭕逝잀쭎逝�쭕逝о┛_逝끶쫾鋤띭쬉鋤뗠━逝�_逝ⓣ┃鋤뉋┏鋤띭━逝�_逝□┸逝멘쭎逝�쭕逝о┛'.split(
            '_'
        ),
        monthsShort: '逝쒉┥逝ⓣ쭅_逝ム쭎逝о쭕逝겯쭅_逝�┥逝겯쭕逝�_逝뤲┴鋤띭┛逝욈┣_逝�쭎_逝쒉쭅逝�_逝쒉쭅逝꿋┥逝�_逝녱쬀逝멘쭕逝�_逝멘쭎逝む쭕逝�_逝끶쫾鋤띭쬉鋤�_逝ⓣ┃鋤�_逝□┸逝멘쭎'.split(
            '_'
        ),
        weekdays: '逝겯━逝욈━逝약┛_逝멘쭓逝�━逝약┛_逝�쬂鋤띭쬀逝꿋━逝약┛_逝о쭅逝㏅━逝약┛_逝о쭇逝밝┯鋤띭┴逝ㅰ┸逝о┥逝�_逝뜩쭅逝뺖쭕逝겯━逝약┛_逝뜩┬逝욈━逝약┛'.split(
            '_'
        ),
        weekdaysShort: '逝겯━逝�_逝멘쭓逝�_逝�쬂鋤띭쬀逝�_逝о쭅逝�_逝о쭇逝밝┯鋤띭┴逝ㅰ┸_逝뜩쭅逝뺖쭕逝�_逝뜩┬逝�'.split('_'),
        weekdaysMin: '逝겯━逝�_逝멘쭓逝�_逝�쬂鋤띭쬀逝�_逝о쭅逝�_逝о쭇逝�_逝뜩쭅逝뺖쭕逝�_逝뜩┬逝�'.split('_'),
        longDateFormat: {
            LT: 'A h:mm 逝멘┏鋤�',
            LTS: 'A h:mm:ss 逝멘┏鋤�',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY, A h:mm 逝멘┏鋤�',
            LLLL: 'dddd, D MMMM YYYY, A h:mm 逝멘┏鋤�',
        },
        calendar: {
            sameDay: '[逝녱쬅] LT',
            nextDay: '[逝녱쬀逝약┏鋤�逝뺖┥逝�] LT',
            nextWeek: 'dddd, LT',
            lastDay: '[逝쀠┐逝뺖┥逝�] LT',
            lastWeek: '[逝쀠┐] dddd, LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s 逝む┛鋤�',
            past: '%s 逝녱쬀鋤�',
            s: '逝뺖쭫鋤뉋쫾 逝멘쭎逝뺖쭎逝ⓣ쭕逝�',
            ss: '%d 逝멘쭎逝뺖쭎逝ⓣ쭕逝�',
            m: '逝뤲쫾 逝�┸逝ⓣ┸逝�',
            mm: '%d 逝�┸逝ⓣ┸逝�',
            h: '逝뤲쫾 逝섁┬鋤띭쬉逝�',
            hh: '%d 逝섁┬鋤띭쬉逝�',
            d: '逝뤲쫾 逝╆┸逝�',
            dd: '%d 逝╆┸逝�',
            M: '逝뤲쫾 逝�┥逝�',
            MM: '%d 逝�┥逝�',
            y: '逝뤲쫾 逝о쬄逝�',
            yy: '%d 逝о쬄逝�',
        },
        preparse: function (string) {
            return string.replace(/[鋤㏅㎤鋤⒯㎦鋤ム㎚鋤�㎜鋤�㏄]/g, function (match) {
                return numberMap$2[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap$3[match];
            });
        },

        meridiemParse: /逝겯┥逝�|逝�쭓逝�|逝멘쫾逝약┣|逝╆쭅逝む쭅逝�|逝о┸逝뺖┥逝�|逝멘┬鋤띭├鋤띭┓逝�|逝겯┥逝�/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '逝겯┥逝�') {
                return hour < 4 ? hour : hour + 12;
            } else if (meridiem === '逝�쭓逝�') {
                return hour;
            } else if (meridiem === '逝멘쫾逝약┣') {
                return hour;
            } else if (meridiem === '逝╆쭅逝む쭅逝�') {
                return hour >= 3 ? hour : hour + 12;
            } else if (meridiem === '逝о┸逝뺖┥逝�') {
                return hour + 12;
            } else if (meridiem === '逝멘┬鋤띭├鋤띭┓逝�') {
                return hour + 12;
            }
        },

        meridiem: function (hour, minute, isLower) {
            if (hour < 4) {
                return '逝겯┥逝�';
            } else if (hour < 6) {
                return '逝�쭓逝�';
            } else if (hour < 12) {
                return '逝멘쫾逝약┣';
            } else if (hour < 15) {
                return '逝╆쭅逝む쭅逝�';
            } else if (hour < 18) {
                return '逝о┸逝뺖┥逝�';
            } else if (hour < 20) {
                return '逝멘┬鋤띭├鋤띭┓逝�';
            } else {
                return '逝겯┥逝�';
            }
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 6, // The week that contains Jan 6th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var symbolMap$4 = {
            1: '鋤�',
            2: '鋤�',
            3: '鋤�',
            4: '鋤�',
            5: '鋤�',
            6: '鋤�',
            7: '鋤�',
            8: '鋤�',
            9: '鋤�',
            0: '鋤�',
        },
        numberMap$3 = {
            '鋤�': '1',
            '鋤�': '2',
            '鋤�': '3',
            '鋤�': '4',
            '鋤�': '5',
            '鋤�': '6',
            '鋤�': '7',
            '鋤�': '8',
            '鋤�': '9',
            '鋤�': '0',
        };

    hooks.defineLocale('bn', {
        months: '逝쒉┥逝ⓣ쭅鋤잀┥逝겯┸_逝ム쭎逝о쭕逝겯쭅鋤잀┥逝겯┸_逝�┥逝겯쭕逝�_逝뤲┴鋤띭┛逝욈┣_逝�쭎_逝쒉쭅逝�_逝쒉쭅逝꿋┥逝�_逝녱쬀逝멘쭕逝�_逝멘쭎逝む쭕逝잀쭎逝�쭕逝о┛_逝끶쫾鋤띭쬉鋤뗠━逝�_逝ⓣ┃鋤뉋┏鋤띭━逝�_逝□┸逝멘쭎逝�쭕逝о┛'.split(
            '_'
        ),
        monthsShort: '逝쒉┥逝ⓣ쭅_逝ム쭎逝о쭕逝겯쭅_逝�┥逝겯쭕逝�_逝뤲┴鋤띭┛逝욈┣_逝�쭎_逝쒉쭅逝�_逝쒉쭅逝꿋┥逝�_逝녱쬀逝멘쭕逝�_逝멘쭎逝む쭕逝�_逝끶쫾鋤띭쬉鋤�_逝ⓣ┃鋤�_逝□┸逝멘쭎'.split(
            '_'
        ),
        weekdays: '逝겯━逝욈━逝약┛_逝멘쭓逝�━逝약┛_逝�쬂鋤띭쬀逝꿋━逝약┛_逝о쭅逝㏅━逝약┛_逝о쭇逝밝┯鋤띭┴逝ㅰ┸逝о┥逝�_逝뜩쭅逝뺖쭕逝겯━逝약┛_逝뜩┬逝욈━逝약┛'.split(
            '_'
        ),
        weekdaysShort: '逝겯━逝�_逝멘쭓逝�_逝�쬂鋤띭쬀逝�_逝о쭅逝�_逝о쭇逝밝┯鋤띭┴逝ㅰ┸_逝뜩쭅逝뺖쭕逝�_逝뜩┬逝�'.split('_'),
        weekdaysMin: '逝겯━逝�_逝멘쭓逝�_逝�쬂鋤띭쬀逝�_逝о쭅逝�_逝о쭇逝�_逝뜩쭅逝뺖쭕逝�_逝뜩┬逝�'.split('_'),
        longDateFormat: {
            LT: 'A h:mm 逝멘┏鋤�',
            LTS: 'A h:mm:ss 逝멘┏鋤�',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY, A h:mm 逝멘┏鋤�',
            LLLL: 'dddd, D MMMM YYYY, A h:mm 逝멘┏鋤�',
        },
        calendar: {
            sameDay: '[逝녱쬅] LT',
            nextDay: '[逝녱쬀逝약┏鋤�逝뺖┥逝�] LT',
            nextWeek: 'dddd, LT',
            lastDay: '[逝쀠┐逝뺖┥逝�] LT',
            lastWeek: '[逝쀠┐] dddd, LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s 逝む┛鋤�',
            past: '%s 逝녱쬀鋤�',
            s: '逝뺖쭫鋤뉋쫾 逝멘쭎逝뺖쭎逝ⓣ쭕逝�',
            ss: '%d 逝멘쭎逝뺖쭎逝ⓣ쭕逝�',
            m: '逝뤲쫾 逝�┸逝ⓣ┸逝�',
            mm: '%d 逝�┸逝ⓣ┸逝�',
            h: '逝뤲쫾 逝섁┬鋤띭쬉逝�',
            hh: '%d 逝섁┬鋤띭쬉逝�',
            d: '逝뤲쫾 逝╆┸逝�',
            dd: '%d 逝╆┸逝�',
            M: '逝뤲쫾 逝�┥逝�',
            MM: '%d 逝�┥逝�',
            y: '逝뤲쫾 逝о쬄逝�',
            yy: '%d 逝о쬄逝�',
        },
        preparse: function (string) {
            return string.replace(/[鋤㏅㎤鋤⒯㎦鋤ム㎚鋤�㎜鋤�㏄]/g, function (match) {
                return numberMap$3[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap$4[match];
            });
        },
        meridiemParse: /逝겯┥逝�|逝멘쫾逝약┣|逝╆쭅逝む쭅逝�|逝о┸逝뺖┥逝�|逝겯┥逝�/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (
                (meridiem === '逝겯┥逝�' && hour >= 4) ||
                (meridiem === '逝╆쭅逝む쭅逝�' && hour < 5) ||
                meridiem === '逝о┸逝뺖┥逝�'
            ) {
                return hour + 12;
            } else {
                return hour;
            }
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 4) {
                return '逝겯┥逝�';
            } else if (hour < 10) {
                return '逝멘쫾逝약┣';
            } else if (hour < 17) {
                return '逝╆쭅逝む쭅逝�';
            } else if (hour < 20) {
                return '逝о┸逝뺖┥逝�';
            } else {
                return '逝겯┥逝�';
            }
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 6, // The week that contains Jan 6th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var symbolMap$5 = {
            1: '善�',
            2: '善�',
            3: '善�',
            4: '善�',
            5: '善�',
            6: '善�',
            7: '善�',
            8: '善�',
            9: '善�',
            0: '善�',
        },
        numberMap$4 = {
            '善�': '1',
            '善�': '2',
            '善�': '3',
            '善�': '4',
            '善�': '5',
            '善�': '6',
            '善�': '7',
            '善�': '8',
            '善�': '9',
            '善�': '0',
        };

    hooks.defineLocale('bo', {
        months: '嬋잀쓱善뗠퐭善뗠퐨嬋꾝펻嬋붲슨_嬋잀쓱善뗠퐭善뗠퐘嬋됢쉿嬋╆펻嬋�_嬋잀쓱善뗠퐭善뗠퐘嬋╆슈嬋섁펻嬋�_嬋잀쓱善뗠퐭善뗠퐭嬋왽쉿善뗠퐫_嬋잀쓱善뗠퐭善뗠숲宣붲펻嬋�_嬋잀쓱善뗠퐭善뗠퐨宣꿋슈嬋귖펻嬋�_嬋잀쓱善뗠퐭善뗠퐭嬋묂슈嬋볙펻嬋�_嬋잀쓱善뗠퐭善뗠퐭嬋№풎宣긍퐨善뗠퐫_嬋잀쓱善뗠퐭善뗠퐨嬋귖슈善뗠퐫_嬋잀쓱善뗠퐭善뗠퐭嬋끶슈善뗠퐫_嬋잀쓱善뗠퐭善뗠퐭嬋끶슈善뗠퐘嬋끶쉿嬋귖펻嬋�_嬋잀쓱善뗠퐭善뗠퐭嬋끶슈善뗠퐘嬋됢쉿嬋╆펻嬋�'.split(
            '_'
        ),
        monthsShort: '嬋잀쓱善�1_嬋잀쓱善�2_嬋잀쓱善�3_嬋잀쓱善�4_嬋잀쓱善�5_嬋잀쓱善�6_嬋잀쓱善�7_嬋잀쓱善�8_嬋잀쓱善�9_嬋잀쓱善�10_嬋잀쓱善�11_嬋잀쓱善�12'.split(
            '_'
        ),
        monthsShortRegex: /^(嬋잀쓱善�\d{1,2})/,
        monthsParseExact: true,
        weekdays: '嬋귖퐶嬋졷펻嬋됢쉿善뗠퐯善�_嬋귖퐶嬋졷펻嬋잀쓱善뗠퐭善�_嬋귖퐶嬋졷펻嬋섁쉿嬋귖펻嬋묂퐯嬋№펻_嬋귖퐶嬋졷펻嬋｀쓿嬋귖펻嬋붲펻_嬋귖퐶嬋졷펻嬋뺖슈嬋№펻嬋뽤슈_嬋귖퐶嬋졷펻嬋붲펻嬋╆퐚嬋╆펻_嬋귖퐶嬋졷펻嬋╆쑈嬋뷕퐪善뗠퐫善�'.split(
            '_'
        ),
        weekdaysShort: '嬋됢쉿善뗠퐯善�_嬋잀쓱善뗠퐭善�_嬋섁쉿嬋귖펻嬋묂퐯嬋№펻_嬋｀쓿嬋귖펻嬋붲펻_嬋뺖슈嬋№펻嬋뽤슈_嬋붲펻嬋╆퐚嬋╆펻_嬋╆쑈嬋뷕퐪善뗠퐫善�'.split(
            '_'
        ),
        weekdaysMin: '嬋됢쉿_嬋잀쓱_嬋섁쉿嬋�_嬋｀쓿嬋�_嬋뺖슈嬋�_嬋╆퐚嬋�_嬋╆쑈嬋뷕퐪'.split('_'),
        longDateFormat: {
            LT: 'A h:mm',
            LTS: 'A h:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY, A h:mm',
            LLLL: 'dddd, D MMMM YYYY, A h:mm',
        },
        calendar: {
            sameDay: '[嬋묂쉿善뗠숱嬋꿋퐚] LT',
            nextDay: '[嬋╆퐚善뗠퐠嬋꿋퐪] LT',
            nextWeek: '[嬋뽤퐨嬋닮퐪善뗠퐬宣꿋퐘善뗠숱宣쀠스嬋╆펻嬋�], LT',
            lastDay: '[嬋곟펻嬋╆퐚] LT',
            lastWeek: '[嬋뽤퐨嬋닮퐪善뗠퐬宣꿋퐘善뗠퐯嬋먣퐷善뗠퐯] dddd, LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s 嬋｀펻',
            past: '%s 嬋╆풐嬋볙펻嬋�',
            s: '嬋｀퐯善뗠쉐嬋�',
            ss: '%d 嬋╆풊嬋№펻嬋녱펾',
            m: '嬋╆풊嬋№펻嬋섁펻嬋귖퐛嬋꿋퐘',
            mm: '%d 嬋╆풊嬋№펻嬋�',
            h: '嬋녱슈善뗠퐱嬋솰퐨善뗠퐘嬋끶쉿嬋�',
            hh: '%d 嬋녱슈善뗠퐱嬋솰퐨',
            d: '嬋됢쉿嬋볙펻嬋귖퐛嬋꿋퐘',
            dd: '%d 嬋됢쉿嬋볙펻',
            M: '嬋잀쓱善뗠퐭善뗠퐘嬋끶쉿嬋�',
            MM: '%d 嬋잀쓱善뗠퐭',
            y: '嬋｀슨善뗠퐘嬋끶쉿嬋�',
            yy: '%d 嬋｀슨',
        },
        preparse: function (string) {
            return string.replace(/[善□샨善｀샴善�샷善㏅섀善⒯폖]/g, function (match) {
                return numberMap$4[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap$5[match];
            });
        },
        meridiemParse: /嬋섁퐱嬋볙펻嬋섁슨|嬋왽슨嬋귖쉐善뗠�嬋�|嬋됢쉿嬋볙펻嬋귖슈嬋�|嬋묂퐘嬋솰퐚善뗠퐨嬋�|嬋섁퐱嬋볙펻嬋섁슨/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (
                (meridiem === '嬋섁퐱嬋볙펻嬋섁슨' && hour >= 4) ||
                (meridiem === '嬋됢쉿嬋볙펻嬋귖슈嬋�' && hour < 5) ||
                meridiem === '嬋묂퐘嬋솰퐚善뗠퐨嬋�'
            ) {
                return hour + 12;
            } else {
                return hour;
            }
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 4) {
                return '嬋섁퐱嬋볙펻嬋섁슨';
            } else if (hour < 10) {
                return '嬋왽슨嬋귖쉐善뗠�嬋�';
            } else if (hour < 17) {
                return '嬋됢쉿嬋볙펻嬋귖슈嬋�';
            } else if (hour < 20) {
                return '嬋묂퐘嬋솰퐚善뗠퐨嬋�';
            } else {
                return '嬋섁퐱嬋볙펻嬋섁슨';
            }
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 6, // The week that contains Jan 6th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    function relativeTimeWithMutation(number, withoutSuffix, key) {
        var format = {
            mm: 'munutenn',
            MM: 'miz',
            dd: 'devezh',
        };
        return number + ' ' + mutation(format[key], number);
    }
    function specialMutationForYears(number) {
        switch (lastNumber(number)) {
            case 1:
            case 3:
            case 4:
            case 5:
            case 9:
                return number + ' bloaz';
            default:
                return number + ' vloaz';
        }
    }
    function lastNumber(number) {
        if (number > 9) {
            return lastNumber(number % 10);
        }
        return number;
    }
    function mutation(text, number) {
        if (number === 2) {
            return softMutation(text);
        }
        return text;
    }
    function softMutation(text) {
        var mutationTable = {
            m: 'v',
            b: 'v',
            d: 'z',
        };
        if (mutationTable[text.charAt(0)] === undefined) {
            return text;
        }
        return mutationTable[text.charAt(0)] + text.substring(1);
    }

    var monthsParse = [
            /^gen/i,
            /^c[迦\']hwe/i,
            /^meu/i,
            /^ebr/i,
            /^mae/i,
            /^(mez|eve)/i,
            /^gou/i,
            /^eos/i,
            /^gwe/i,
            /^her/i,
            /^du/i,
            /^ker/i,
        ],
        monthsRegex$1 = /^(genver|c[迦\']hwevrer|meurzh|ebrel|mae|mezheven|gouere|eost|gwengolo|here|du|kerzu|gen|c[迦\']hwe|meu|ebr|mae|eve|gou|eos|gwe|her|du|ker)/i,
        monthsStrictRegex = /^(genver|c[迦\']hwevrer|meurzh|ebrel|mae|mezheven|gouere|eost|gwengolo|here|du|kerzu)/i,
        monthsShortStrictRegex = /^(gen|c[迦\']hwe|meu|ebr|mae|eve|gou|eos|gwe|her|du|ker)/i,
        fullWeekdaysParse = [
            /^sul/i,
            /^lun/i,
            /^meurzh/i,
            /^merc[迦\']her/i,
            /^yaou/i,
            /^gwener/i,
            /^sadorn/i,
        ],
        shortWeekdaysParse = [
            /^Sul/i,
            /^Lun/i,
            /^Meu/i,
            /^Mer/i,
            /^Yao/i,
            /^Gwe/i,
            /^Sad/i,
        ],
        minWeekdaysParse = [
            /^Su/i,
            /^Lu/i,
            /^Me([^r]|$)/i,
            /^Mer/i,
            /^Ya/i,
            /^Gw/i,
            /^Sa/i,
        ];

    hooks.defineLocale('br', {
        months: 'Genver_C迦hwevrer_Meurzh_Ebrel_Mae_Mezheven_Gouere_Eost_Gwengolo_Here_Du_Kerzu'.split(
            '_'
        ),
        monthsShort: 'Gen_C迦hwe_Meu_Ebr_Mae_Eve_Gou_Eos_Gwe_Her_Du_Ker'.split('_'),
        weekdays: 'Sul_Lun_Meurzh_Merc迦her_Yaou_Gwener_Sadorn'.split('_'),
        weekdaysShort: 'Sul_Lun_Meu_Mer_Yao_Gwe_Sad'.split('_'),
        weekdaysMin: 'Su_Lu_Me_Mer_Ya_Gw_Sa'.split('_'),
        weekdaysParse: minWeekdaysParse,
        fullWeekdaysParse: fullWeekdaysParse,
        shortWeekdaysParse: shortWeekdaysParse,
        minWeekdaysParse: minWeekdaysParse,

        monthsRegex: monthsRegex$1,
        monthsShortRegex: monthsRegex$1,
        monthsStrictRegex: monthsStrictRegex,
        monthsShortStrictRegex: monthsShortStrictRegex,
        monthsParse: monthsParse,
        longMonthsParse: monthsParse,
        shortMonthsParse: monthsParse,

        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D [a viz] MMMM YYYY',
            LLL: 'D [a viz] MMMM YYYY HH:mm',
            LLLL: 'dddd, D [a viz] MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Hiziv da] LT',
            nextDay: '[Warc迦hoazh da] LT',
            nextWeek: 'dddd [da] LT',
            lastDay: '[Dec迦h da] LT',
            lastWeek: 'dddd [paset da] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'a-benn %s',
            past: '%s 迦zo',
            s: 'un nebeud segondenno첫',
            ss: '%d eilenn',
            m: 'ur vunutenn',
            mm: relativeTimeWithMutation,
            h: 'un eur',
            hh: '%d eur',
            d: 'un devezh',
            dd: relativeTimeWithMutation,
            M: 'ur miz',
            MM: relativeTimeWithMutation,
            y: 'ur bloaz',
            yy: specialMutationForYears,
        },
        dayOfMonthOrdinalParse: /\d{1,2}(a챰|vet)/,
        ordinal: function (number) {
            var output = number === 1 ? 'a챰' : 'vet';
            return number + output;
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
        meridiemParse: /a.m.|g.m./, // goude merenn | a-raok merenn
        isPM: function (token) {
            return token === 'g.m.';
        },
        meridiem: function (hour, minute, isLower) {
            return hour < 12 ? 'a.m.' : 'g.m.';
        },
    });

    //! moment.js locale configuration

    function translate(number, withoutSuffix, key) {
        var result = number + ' ';
        switch (key) {
            case 'ss':
                if (number === 1) {
                    result += 'sekunda';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'sekunde';
                } else {
                    result += 'sekundi';
                }
                return result;
            case 'm':
                return withoutSuffix ? 'jedna minuta' : 'jedne minute';
            case 'mm':
                if (number === 1) {
                    result += 'minuta';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'minute';
                } else {
                    result += 'minuta';
                }
                return result;
            case 'h':
                return withoutSuffix ? 'jedan sat' : 'jednog sata';
            case 'hh':
                if (number === 1) {
                    result += 'sat';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'sata';
                } else {
                    result += 'sati';
                }
                return result;
            case 'dd':
                if (number === 1) {
                    result += 'dan';
                } else {
                    result += 'dana';
                }
                return result;
            case 'MM':
                if (number === 1) {
                    result += 'mjesec';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'mjeseca';
                } else {
                    result += 'mjeseci';
                }
                return result;
            case 'yy':
                if (number === 1) {
                    result += 'godina';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'godine';
                } else {
                    result += 'godina';
                }
                return result;
        }
    }

    hooks.defineLocale('bs', {
        months: 'januar_februar_mart_april_maj_juni_juli_august_septembar_oktobar_novembar_decembar'.split(
            '_'
        ),
        monthsShort: 'jan._feb._mar._apr._maj._jun._jul._aug._sep._okt._nov._dec.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'nedjelja_ponedjeljak_utorak_srijeda_훾etvrtak_petak_subota'.split(
            '_'
        ),
        weekdaysShort: 'ned._pon._uto._sri._훾et._pet._sub.'.split('_'),
        weekdaysMin: 'ne_po_ut_sr_훾e_pe_su'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY H:mm',
            LLLL: 'dddd, D. MMMM YYYY H:mm',
        },
        calendar: {
            sameDay: '[danas u] LT',
            nextDay: '[sutra u] LT',
            nextWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[u] [nedjelju] [u] LT';
                    case 3:
                        return '[u] [srijedu] [u] LT';
                    case 6:
                        return '[u] [subotu] [u] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[u] dddd [u] LT';
                }
            },
            lastDay: '[ju훾er u] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                    case 3:
                        return '[pro큄lu] dddd [u] LT';
                    case 6:
                        return '[pro큄le] [subote] [u] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[pro큄li] dddd [u] LT';
                }
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: 'za %s',
            past: 'prije %s',
            s: 'par sekundi',
            ss: translate,
            m: translate,
            mm: translate,
            h: translate,
            hh: translate,
            d: 'dan',
            dd: translate,
            M: 'mjesec',
            MM: translate,
            y: 'godinu',
            yy: translate,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('ca', {
        months: {
            standalone: 'gener_febrer_mar챌_abril_maig_juny_juliol_agost_setembre_octubre_novembre_desembre'.split(
                '_'
            ),
            format: "de gener_de febrer_de mar챌_d'abril_de maig_de juny_de juliol_d'agost_de setembre_d'octubre_de novembre_de desembre".split(
                '_'
            ),
            isFormat: /D[oD]?(\s)+MMMM/,
        },
        monthsShort: 'gen._febr._mar챌_abr._maig_juny_jul._ag._set._oct._nov._des.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'diumenge_dilluns_dimarts_dimecres_dijous_divendres_dissabte'.split(
            '_'
        ),
        weekdaysShort: 'dg._dl._dt._dc._dj._dv._ds.'.split('_'),
        weekdaysMin: 'dg_dl_dt_dc_dj_dv_ds'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM [de] YYYY',
            ll: 'D MMM YYYY',
            LLL: 'D MMMM [de] YYYY [a les] H:mm',
            lll: 'D MMM YYYY, H:mm',
            LLLL: 'dddd D MMMM [de] YYYY [a les] H:mm',
            llll: 'ddd D MMM YYYY, H:mm',
        },
        calendar: {
            sameDay: function () {
                return '[avui a ' + (this.hours() !== 1 ? 'les' : 'la') + '] LT';
            },
            nextDay: function () {
                return '[dem횪 a ' + (this.hours() !== 1 ? 'les' : 'la') + '] LT';
            },
            nextWeek: function () {
                return 'dddd [a ' + (this.hours() !== 1 ? 'les' : 'la') + '] LT';
            },
            lastDay: function () {
                return '[ahir a ' + (this.hours() !== 1 ? 'les' : 'la') + '] LT';
            },
            lastWeek: function () {
                return (
                    '[el] dddd [passat a ' +
                    (this.hours() !== 1 ? 'les' : 'la') +
                    '] LT'
                );
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: "d'aqu챠 %s",
            past: 'fa %s',
            s: 'uns segons',
            ss: '%d segons',
            m: 'un minut',
            mm: '%d minuts',
            h: 'una hora',
            hh: '%d hores',
            d: 'un dia',
            dd: '%d dies',
            M: 'un mes',
            MM: '%d mesos',
            y: 'un any',
            yy: '%d anys',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(r|n|t|챔|a)/,
        ordinal: function (number, period) {
            var output =
                number === 1
                    ? 'r'
                    : number === 2
                        ? 'n'
                        : number === 3
                            ? 'r'
                            : number === 4
                                ? 't'
                                : '챔';
            if (period === 'w' || period === 'W') {
                output = 'a';
            }
            return number + output;
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var months$4 = 'leden_첬nor_b힂ezen_duben_kv휎ten_훾erven_훾ervenec_srpen_z찼힂챠_힂챠jen_listopad_prosinec'.split(
            '_'
        ),
        monthsShort = 'led_첬no_b힂e_dub_kv휎_훾vn_훾vc_srp_z찼힂_힂챠j_lis_pro'.split('_'),
        monthsParse$1 = [
            /^led/i,
            /^첬no/i,
            /^b힂e/i,
            /^dub/i,
            /^kv휎/i,
            /^(훾vn|훾erven$|훾ervna)/i,
            /^(훾vc|훾ervenec|훾ervence)/i,
            /^srp/i,
            /^z찼힂/i,
            /^힂챠j/i,
            /^lis/i,
            /^pro/i,
        ],
        // NOTE: '훾erven' is substring of '훾ervenec'; therefore '훾ervenec' must precede '훾erven' in the regex to be fully matched.
        // Otherwise parser matches '1. 훾ervenec' as '1. 훾erven' + 'ec'.
        monthsRegex$2 = /^(leden|첬nor|b힂ezen|duben|kv휎ten|훾ervenec|훾ervence|훾erven|훾ervna|srpen|z찼힂챠|힂챠jen|listopad|prosinec|led|첬no|b힂e|dub|kv휎|훾vn|훾vc|srp|z찼힂|힂챠j|lis|pro)/i;

    function plural$1(n) {
        return n > 1 && n < 5 && ~~(n / 10) !== 1;
    }
    function translate$1(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        switch (key) {
            case 's': // a few seconds / in a few seconds / a few seconds ago
                return withoutSuffix || isFuture ? 'p찼r sekund' : 'p찼r sekundami';
            case 'ss': // 9 seconds / in 9 seconds / 9 seconds ago
                if (withoutSuffix || isFuture) {
                    return result + (plural$1(number) ? 'sekundy' : 'sekund');
                } else {
                    return result + 'sekundami';
                }
            case 'm': // a minute / in a minute / a minute ago
                return withoutSuffix ? 'minuta' : isFuture ? 'minutu' : 'minutou';
            case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
                if (withoutSuffix || isFuture) {
                    return result + (plural$1(number) ? 'minuty' : 'minut');
                } else {
                    return result + 'minutami';
                }
            case 'h': // an hour / in an hour / an hour ago
                return withoutSuffix ? 'hodina' : isFuture ? 'hodinu' : 'hodinou';
            case 'hh': // 9 hours / in 9 hours / 9 hours ago
                if (withoutSuffix || isFuture) {
                    return result + (plural$1(number) ? 'hodiny' : 'hodin');
                } else {
                    return result + 'hodinami';
                }
            case 'd': // a day / in a day / a day ago
                return withoutSuffix || isFuture ? 'den' : 'dnem';
            case 'dd': // 9 days / in 9 days / 9 days ago
                if (withoutSuffix || isFuture) {
                    return result + (plural$1(number) ? 'dny' : 'dn챠');
                } else {
                    return result + 'dny';
                }
            case 'M': // a month / in a month / a month ago
                return withoutSuffix || isFuture ? 'm휎s챠c' : 'm휎s챠cem';
            case 'MM': // 9 months / in 9 months / 9 months ago
                if (withoutSuffix || isFuture) {
                    return result + (plural$1(number) ? 'm휎s챠ce' : 'm휎s챠c킁');
                } else {
                    return result + 'm휎s챠ci';
                }
            case 'y': // a year / in a year / a year ago
                return withoutSuffix || isFuture ? 'rok' : 'rokem';
            case 'yy': // 9 years / in 9 years / 9 years ago
                if (withoutSuffix || isFuture) {
                    return result + (plural$1(number) ? 'roky' : 'let');
                } else {
                    return result + 'lety';
                }
        }
    }

    hooks.defineLocale('cs', {
        months: months$4,
        monthsShort: monthsShort,
        monthsRegex: monthsRegex$2,
        monthsShortRegex: monthsRegex$2,
        // NOTE: '훾erven' is substring of '훾ervenec'; therefore '훾ervenec' must precede '훾erven' in the regex to be fully matched.
        // Otherwise parser matches '1. 훾ervenec' as '1. 훾erven' + 'ec'.
        monthsStrictRegex: /^(leden|ledna|첬nora|첬nor|b힂ezen|b힂ezna|duben|dubna|kv휎ten|kv휎tna|훾ervenec|훾ervence|훾erven|훾ervna|srpen|srpna|z찼힂챠|힂챠jen|힂챠jna|listopadu|listopad|prosinec|prosince)/i,
        monthsShortStrictRegex: /^(led|첬no|b힂e|dub|kv휎|훾vn|훾vc|srp|z찼힂|힂챠j|lis|pro)/i,
        monthsParse: monthsParse$1,
        longMonthsParse: monthsParse$1,
        shortMonthsParse: monthsParse$1,
        weekdays: 'ned휎le_pond휎l챠_첬ter첵_st힂eda_훾tvrtek_p찼tek_sobota'.split('_'),
        weekdaysShort: 'ne_po_첬t_st_훾t_p찼_so'.split('_'),
        weekdaysMin: 'ne_po_첬t_st_훾t_p찼_so'.split('_'),
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY H:mm',
            LLLL: 'dddd D. MMMM YYYY H:mm',
            l: 'D. M. YYYY',
        },
        calendar: {
            sameDay: '[dnes v] LT',
            nextDay: '[z챠tra v] LT',
            nextWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[v ned휎li v] LT';
                    case 1:
                    case 2:
                        return '[v] dddd [v] LT';
                    case 3:
                        return '[ve st힂edu v] LT';
                    case 4:
                        return '[ve 훾tvrtek v] LT';
                    case 5:
                        return '[v p찼tek v] LT';
                    case 6:
                        return '[v sobotu v] LT';
                }
            },
            lastDay: '[v훾era v] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[minulou ned휎li v] LT';
                    case 1:
                    case 2:
                        return '[minul챕] dddd [v] LT';
                    case 3:
                        return '[minulou st힂edu v] LT';
                    case 4:
                    case 5:
                        return '[minul첵] dddd [v] LT';
                    case 6:
                        return '[minulou sobotu v] LT';
                }
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: 'za %s',
            past: 'p힂ed %s',
            s: translate$1,
            ss: translate$1,
            m: translate$1,
            mm: translate$1,
            h: translate$1,
            hh: translate$1,
            d: translate$1,
            dd: translate$1,
            M: translate$1,
            MM: translate$1,
            y: translate$1,
            yy: translate$1,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('cv', {
        months: '克��剋逵�_戟逵���_極��_逵克逵_劇逵橘_郎���劇筠_���_郎��剋逵_逵勻�戟_�極逵_�鄲克_�逵��逵勻'.split(
            '_'
        ),
        monthsShort: '克��_戟逵�_極��_逵克逵_劇逵橘_郎��_���_郎��_逵勻戟_�極逵_�鄲克_�逵�'.split('_'),
        weekdays: '勻���逵�戟龜克�戟_��戟�龜克�戟_��剋逵�龜克�戟_�戟克�戟_克�郎戟筠�戟龜克�戟_��戟筠克�戟_��劇逵�克�戟'.split(
            '_'
        ),
        weekdaysShort: '勻��_��戟_��剋_�戟_克�郎_��戟_��劇'.split('_'),
        weekdaysMin: '勻�_�戟_��_�戟_克郎_��_�劇'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD-MM-YYYY',
            LL: 'YYYY [郎�剋�龜] MMMM [�橘���戟] D[-劇���]',
            LLL: 'YYYY [郎�剋�龜] MMMM [�橘���戟] D[-劇���], HH:mm',
            LLLL: 'dddd, YYYY [郎�剋�龜] MMMM [�橘���戟] D[-劇���], HH:mm',
        },
        calendar: {
            sameDay: '[�逵�戟] LT [�筠�筠��筠]',
            nextDay: '[竅�逵戟] LT [�筠�筠��筠]',
            lastDay: '[�戟筠�] LT [�筠�筠��筠]',
            nextWeek: '[狼龜�筠�] dddd LT [�筠�筠��筠]',
            lastWeek: '[���戟�] dddd LT [�筠�筠��筠]',
            sameElse: 'L',
        },
        relativeTime: {
            future: function (output) {
                var affix = /�筠�筠�$/i.exec(output)
                    ? '�筠戟'
                    : /郎�剋$/i.exec(output)
                        ? '�逵戟'
                        : '�逵戟';
                return output + affix;
            },
            past: '%s 克逵�剋剋逵',
            s: '極��-龜克 郎筠克克�戟�',
            ss: '%d 郎筠克克�戟�',
            m: '極�� 劇龜戟��',
            mm: '%d 劇龜戟��',
            h: '極�� �筠�筠�',
            hh: '%d �筠�筠�',
            d: '極�� 克�戟',
            dd: '%d 克�戟',
            M: '極�� �橘��',
            MM: '%d �橘��',
            y: '極�� 郎�剋',
            yy: '%d 郎�剋',
        },
        dayOfMonthOrdinalParse: /\d{1,2}-劇��/,
        ordinal: '%d-劇��',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('cy', {
        months: 'Ionawr_Chwefror_Mawrth_Ebrill_Mai_Mehefin_Gorffennaf_Awst_Medi_Hydref_Tachwedd_Rhagfyr'.split(
            '_'
        ),
        monthsShort: 'Ion_Chwe_Maw_Ebr_Mai_Meh_Gor_Aws_Med_Hyd_Tach_Rhag'.split(
            '_'
        ),
        weekdays: 'Dydd Sul_Dydd Llun_Dydd Mawrth_Dydd Mercher_Dydd Iau_Dydd Gwener_Dydd Sadwrn'.split(
            '_'
        ),
        weekdaysShort: 'Sul_Llun_Maw_Mer_Iau_Gwe_Sad'.split('_'),
        weekdaysMin: 'Su_Ll_Ma_Me_Ia_Gw_Sa'.split('_'),
        weekdaysParseExact: true,
        // time formats are the same as en-gb
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Heddiw am] LT',
            nextDay: '[Yfory am] LT',
            nextWeek: 'dddd [am] LT',
            lastDay: '[Ddoe am] LT',
            lastWeek: 'dddd [diwethaf am] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'mewn %s',
            past: '%s yn 척l',
            s: 'ychydig eiliadau',
            ss: '%d eiliad',
            m: 'munud',
            mm: '%d munud',
            h: 'awr',
            hh: '%d awr',
            d: 'diwrnod',
            dd: '%d diwrnod',
            M: 'mis',
            MM: '%d mis',
            y: 'blwyddyn',
            yy: '%d flynedd',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(fed|ain|af|il|ydd|ed|eg)/,
        // traditional ordinal numbers above 31 are not commonly used in colloquial Welsh
        ordinal: function (number) {
            var b = number,
                output = '',
                lookup = [
                    '',
                    'af',
                    'il',
                    'ydd',
                    'ydd',
                    'ed',
                    'ed',
                    'ed',
                    'fed',
                    'fed',
                    'fed', // 1af to 10fed
                    'eg',
                    'fed',
                    'eg',
                    'eg',
                    'fed',
                    'eg',
                    'eg',
                    'fed',
                    'eg',
                    'fed', // 11eg to 20fed
                ];
            if (b > 20) {
                if (b === 40 || b === 50 || b === 60 || b === 80 || b === 100) {
                    output = 'fed'; // not 30ain, 70ain or 90ain
                } else {
                    output = 'ain';
                }
            } else if (b > 0) {
                output = lookup[b];
            }
            return number + output;
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('da', {
        months: 'januar_februar_marts_april_maj_juni_juli_august_september_oktober_november_december'.split(
            '_'
        ),
        monthsShort: 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split('_'),
        weekdays: 's첩ndag_mandag_tirsdag_onsdag_torsdag_fredag_l첩rdag'.split('_'),
        weekdaysShort: 's첩n_man_tir_ons_tor_fre_l첩r'.split('_'),
        weekdaysMin: 's첩_ma_ti_on_to_fr_l첩'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY HH:mm',
            LLLL: 'dddd [d.] D. MMMM YYYY [kl.] HH:mm',
        },
        calendar: {
            sameDay: '[i dag kl.] LT',
            nextDay: '[i morgen kl.] LT',
            nextWeek: 'p책 dddd [kl.] LT',
            lastDay: '[i g책r kl.] LT',
            lastWeek: '[i] dddd[s kl.] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'om %s',
            past: '%s siden',
            s: 'f책 sekunder',
            ss: '%d sekunder',
            m: 'et minut',
            mm: '%d minutter',
            h: 'en time',
            hh: '%d timer',
            d: 'en dag',
            dd: '%d dage',
            M: 'en m책ned',
            MM: '%d m책neder',
            y: 'et 책r',
            yy: '%d 책r',
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    function processRelativeTime(number, withoutSuffix, key, isFuture) {
        var format = {
            m: ['eine Minute', 'einer Minute'],
            h: ['eine Stunde', 'einer Stunde'],
            d: ['ein Tag', 'einem Tag'],
            dd: [number + ' Tage', number + ' Tagen'],
            w: ['eine Woche', 'einer Woche'],
            M: ['ein Monat', 'einem Monat'],
            MM: [number + ' Monate', number + ' Monaten'],
            y: ['ein Jahr', 'einem Jahr'],
            yy: [number + ' Jahre', number + ' Jahren'],
        };
        return withoutSuffix ? format[key][0] : format[key][1];
    }

    hooks.defineLocale('de-at', {
        months: 'J채nner_Februar_M채rz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split(
            '_'
        ),
        monthsShort: 'J채n._Feb._M채rz_Apr._Mai_Juni_Juli_Aug._Sep._Okt._Nov._Dez.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split(
            '_'
        ),
        weekdaysShort: 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
        weekdaysMin: 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY HH:mm',
            LLLL: 'dddd, D. MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[heute um] LT [Uhr]',
            sameElse: 'L',
            nextDay: '[morgen um] LT [Uhr]',
            nextWeek: 'dddd [um] LT [Uhr]',
            lastDay: '[gestern um] LT [Uhr]',
            lastWeek: '[letzten] dddd [um] LT [Uhr]',
        },
        relativeTime: {
            future: 'in %s',
            past: 'vor %s',
            s: 'ein paar Sekunden',
            ss: '%d Sekunden',
            m: processRelativeTime,
            mm: '%d Minuten',
            h: processRelativeTime,
            hh: '%d Stunden',
            d: processRelativeTime,
            dd: processRelativeTime,
            w: processRelativeTime,
            ww: '%d Wochen',
            M: processRelativeTime,
            MM: processRelativeTime,
            y: processRelativeTime,
            yy: processRelativeTime,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    function processRelativeTime$1(number, withoutSuffix, key, isFuture) {
        var format = {
            m: ['eine Minute', 'einer Minute'],
            h: ['eine Stunde', 'einer Stunde'],
            d: ['ein Tag', 'einem Tag'],
            dd: [number + ' Tage', number + ' Tagen'],
            w: ['eine Woche', 'einer Woche'],
            M: ['ein Monat', 'einem Monat'],
            MM: [number + ' Monate', number + ' Monaten'],
            y: ['ein Jahr', 'einem Jahr'],
            yy: [number + ' Jahre', number + ' Jahren'],
        };
        return withoutSuffix ? format[key][0] : format[key][1];
    }

    hooks.defineLocale('de-ch', {
        months: 'Januar_Februar_M채rz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split(
            '_'
        ),
        monthsShort: 'Jan._Feb._M채rz_Apr._Mai_Juni_Juli_Aug._Sep._Okt._Nov._Dez.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split(
            '_'
        ),
        weekdaysShort: 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
        weekdaysMin: 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY HH:mm',
            LLLL: 'dddd, D. MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[heute um] LT [Uhr]',
            sameElse: 'L',
            nextDay: '[morgen um] LT [Uhr]',
            nextWeek: 'dddd [um] LT [Uhr]',
            lastDay: '[gestern um] LT [Uhr]',
            lastWeek: '[letzten] dddd [um] LT [Uhr]',
        },
        relativeTime: {
            future: 'in %s',
            past: 'vor %s',
            s: 'ein paar Sekunden',
            ss: '%d Sekunden',
            m: processRelativeTime$1,
            mm: '%d Minuten',
            h: processRelativeTime$1,
            hh: '%d Stunden',
            d: processRelativeTime$1,
            dd: processRelativeTime$1,
            w: processRelativeTime$1,
            ww: '%d Wochen',
            M: processRelativeTime$1,
            MM: processRelativeTime$1,
            y: processRelativeTime$1,
            yy: processRelativeTime$1,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    function processRelativeTime$2(number, withoutSuffix, key, isFuture) {
        var format = {
            m: ['eine Minute', 'einer Minute'],
            h: ['eine Stunde', 'einer Stunde'],
            d: ['ein Tag', 'einem Tag'],
            dd: [number + ' Tage', number + ' Tagen'],
            w: ['eine Woche', 'einer Woche'],
            M: ['ein Monat', 'einem Monat'],
            MM: [number + ' Monate', number + ' Monaten'],
            y: ['ein Jahr', 'einem Jahr'],
            yy: [number + ' Jahre', number + ' Jahren'],
        };
        return withoutSuffix ? format[key][0] : format[key][1];
    }

    hooks.defineLocale('de', {
        months: 'Januar_Februar_M채rz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split(
            '_'
        ),
        monthsShort: 'Jan._Feb._M채rz_Apr._Mai_Juni_Juli_Aug._Sep._Okt._Nov._Dez.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split(
            '_'
        ),
        weekdaysShort: 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
        weekdaysMin: 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY HH:mm',
            LLLL: 'dddd, D. MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[heute um] LT [Uhr]',
            sameElse: 'L',
            nextDay: '[morgen um] LT [Uhr]',
            nextWeek: 'dddd [um] LT [Uhr]',
            lastDay: '[gestern um] LT [Uhr]',
            lastWeek: '[letzten] dddd [um] LT [Uhr]',
        },
        relativeTime: {
            future: 'in %s',
            past: 'vor %s',
            s: 'ein paar Sekunden',
            ss: '%d Sekunden',
            m: processRelativeTime$2,
            mm: '%d Minuten',
            h: processRelativeTime$2,
            hh: '%d Stunden',
            d: processRelativeTime$2,
            dd: processRelativeTime$2,
            w: processRelativeTime$2,
            ww: '%d Wochen',
            M: processRelativeTime$2,
            MM: processRelativeTime$2,
            y: processRelativeTime$2,
            yy: processRelativeTime$2,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var months$5 = [
            '�鼻�非�誹�鄙',
            '�鼻�斌�非�誹�鄙',
            '�譬�費�非',
            '�嚬�斌�鄙�非',
            '�嚬',
            '�飛�斌',
            '�非�誹�費',
            '�彬�誹�斌�非',
            '�鼻�斌�鼻�斌�誹�非',
            '�嬪�斌�彬�誹�非',
            '�嬪�鼻�斌�誹�非',
            '�費�鼻�斌�誹�非',
        ],
        weekdays = [
            '�譬�費�斌�誹',
            '�彬�誹',
            '�誹�斌�譬�誹',
            '�非�誹',
            '�非�譬�斌�誹�費',
            '�非�非�非',
            '�嬪�費�費�非',
        ];

    hooks.defineLocale('dv', {
        months: months$5,
        monthsShort: months$5,
        weekdays: weekdays,
        weekdaysShort: weekdays,
        weekdaysMin: '�譬�費_�彬�誹_�誹�斌_�非�誹_�非�譬_�非�非_�嬪�費'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'D/M/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        meridiemParse: /��|��/,
        isPM: function (input) {
            return '��' === input;
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 12) {
                return '��';
            } else {
                return '��';
            }
        },
        calendar: {
            sameDay: '[�費�誹�非] LT',
            nextDay: '[�譬�誹�譬] LT',
            nextWeek: 'dddd LT',
            lastDay: '[�費�斌�鼻] LT',
            lastWeek: '[�譬�費�非�費] dddd LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '�鼻�嚬�誹�費 %s',
            past: '�非�費�斌 %s',
            s: '�費�非�斌�非�嬪�鼻�斌',
            ss: 'd% �費�非�斌�非',
            m: '�費�費�鼻�斌',
            mm: '�費�費�非 %d',
            h: '�誹�費�費�鼻�斌',
            hh: '�誹�費�費�非 %d',
            d: '�非�誹�鼻�斌',
            dd: '�非�誹�斌 %d',
            M: '�誹�鼻�斌',
            MM: '�誹�斌 %d',
            y: '�誹�誹�鼻�斌',
            yy: '�誹�誹�非 %d',
        },
        preparse: function (string) {
            return string.replace(/�/g, ',');
        },
        postformat: function (string) {
            return string.replace(/,/g, '�');
        },
        week: {
            dow: 7, // Sunday is the first day of the week.
            doy: 12, // The week that contains Jan 12th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    function isFunction$1(input) {
        return (
            (typeof Function !== 'undefined' && input instanceof Function) ||
            Object.prototype.toString.call(input) === '[object Function]'
        );
    }

    hooks.defineLocale('el', {
        monthsNominativeEl: '�慣館恝�郭�菅恝�_過琯棺�恝�郭�菅恝�_�郭��菅恝�_���官貫菅恝�_�郭菅恝�_�恝�館菅恝�_�恝�貫菅恝�_��款恝���恝�_誇琯��串關棺�菅恝�_�觀��棺�菅恝�_�恝串關棺�菅恝�_�琯觀串關棺�菅恝�'.split(
            '_'
        ),
        monthsGenitiveEl: '�慣館恝�慣�官恝�_過琯棺�恝�慣�官恝�_�慣��官恝�_���菅貫官恝�_�慣�恝�_�恝�館官恝�_�恝�貫官恝�_��款恝���恝�_誇琯��琯關棺�官恝�_�觀��棺�官恝�_�恝琯關棺�官恝�_�琯觀琯關棺�官恝�'.split(
            '_'
        ),
        months: function (momentToFormat, format) {
            if (!momentToFormat) {
                return this._monthsNominativeEl;
            } else if (
                typeof format === 'string' &&
                /D/.test(format.substring(0, format.indexOf('MMMM')))
            ) {
                // if there is a day number before 'MMMM'
                return this._monthsGenitiveEl[momentToFormat.month()];
            } else {
                return this._monthsNominativeEl[momentToFormat.month()];
            }
        },
        monthsShort: '�慣館_過琯棺_�慣�_���_�慣�_�恝�館_�恝�貫_��款_誇琯�_�觀�_�恝琯_�琯觀'.split('_'),
        weekdays: '���菅慣觀冠_�琯��串�慣_課�官�管_課琯�郭��管_�串關��管_�慣�慣�觀琯�冠_誇郭棺棺慣�恝'.split(
            '_'
        ),
        weekdaysShort: '���_�琯�_課�菅_課琯�_�琯關_�慣�_誇慣棺'.split('_'),
        weekdaysMin: '��_�琯_課�_課琯_�琯_�慣_誇慣'.split('_'),
        meridiem: function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? '關關' : '��';
            } else {
                return isLower ? '�關' : '��';
            }
        },
        isPM: function (input) {
            return (input + '').toLowerCase()[0] === '關';
        },
        meridiemParse: /[��]\.?�?\.?/i,
        longDateFormat: {
            LT: 'h:mm A',
            LTS: 'h:mm:ss A',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY h:mm A',
            LLLL: 'dddd, D MMMM YYYY h:mm A',
        },
        calendarEl: {
            sameDay: '[誇冠關琯�慣 {}] LT',
            nextDay: '[���菅恝 {}] LT',
            nextWeek: 'dddd [{}] LT',
            lastDay: '[鍋罐琯� {}] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 6:
                        return '[�恝 ��恝管款恝�關琯館恝] dddd [{}] LT';
                    default:
                        return '[�管館 ��恝管款恝�關琯館管] dddd [{}] LT';
                }
            },
            sameElse: 'L',
        },
        calendar: function (key, mom) {
            var output = this._calendarEl[key],
                hours = mom && mom.hours();
            if (isFunction$1(output)) {
                output = output.apply(mom);
            }
            return output.replace('{}', hours % 12 === 1 ? '��管' : '��菅�');
        },
        relativeTime: {
            future: '�琯 %s',
            past: '%s ��菅館',
            s: '貫官款慣 灌琯��琯��貫琯��慣',
            ss: '%d 灌琯��琯��貫琯��慣',
            m: '串館慣 貫琯���',
            mm: '%d 貫琯��郭',
            h: '關官慣 ��慣',
            hh: '%d ��琯�',
            d: '關官慣 關串�慣',
            dd: '%d 關串�琯�',
            M: '串館慣� 關冠館慣�',
            MM: '%d 關冠館琯�',
            y: '串館慣� ���館恝�',
            yy: '%d ���館菅慣',
        },
        dayOfMonthOrdinalParse: /\d{1,2}管/,
        ordinal: '%d管',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4st is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('en-au', {
        months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
            '_'
        ),
        monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
            '_'
        ),
        weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat: {
            LT: 'h:mm A',
            LTS: 'h:mm:ss A',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY h:mm A',
            LLLL: 'dddd, D MMMM YYYY h:mm A',
        },
        calendar: {
            sameDay: '[Today at] LT',
            nextDay: '[Tomorrow at] LT',
            nextWeek: 'dddd [at] LT',
            lastDay: '[Yesterday at] LT',
            lastWeek: '[Last] dddd [at] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'in %s',
            past: '%s ago',
            s: 'a few seconds',
            ss: '%d seconds',
            m: 'a minute',
            mm: '%d minutes',
            h: 'an hour',
            hh: '%d hours',
            d: 'a day',
            dd: '%d days',
            M: 'a month',
            MM: '%d months',
            y: 'a year',
            yy: '%d years',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal: function (number) {
            var b = number % 10,
                output =
                    ~~((number % 100) / 10) === 1
                        ? 'th'
                        : b === 1
                            ? 'st'
                            : b === 2
                                ? 'nd'
                                : b === 3
                                    ? 'rd'
                                    : 'th';
            return number + output;
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('en-ca', {
        months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
            '_'
        ),
        monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
            '_'
        ),
        weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat: {
            LT: 'h:mm A',
            LTS: 'h:mm:ss A',
            L: 'YYYY-MM-DD',
            LL: 'MMMM D, YYYY',
            LLL: 'MMMM D, YYYY h:mm A',
            LLLL: 'dddd, MMMM D, YYYY h:mm A',
        },
        calendar: {
            sameDay: '[Today at] LT',
            nextDay: '[Tomorrow at] LT',
            nextWeek: 'dddd [at] LT',
            lastDay: '[Yesterday at] LT',
            lastWeek: '[Last] dddd [at] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'in %s',
            past: '%s ago',
            s: 'a few seconds',
            ss: '%d seconds',
            m: 'a minute',
            mm: '%d minutes',
            h: 'an hour',
            hh: '%d hours',
            d: 'a day',
            dd: '%d days',
            M: 'a month',
            MM: '%d months',
            y: 'a year',
            yy: '%d years',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal: function (number) {
            var b = number % 10,
                output =
                    ~~((number % 100) / 10) === 1
                        ? 'th'
                        : b === 1
                            ? 'st'
                            : b === 2
                                ? 'nd'
                                : b === 3
                                    ? 'rd'
                                    : 'th';
            return number + output;
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('en-gb', {
        months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
            '_'
        ),
        monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
            '_'
        ),
        weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Today at] LT',
            nextDay: '[Tomorrow at] LT',
            nextWeek: 'dddd [at] LT',
            lastDay: '[Yesterday at] LT',
            lastWeek: '[Last] dddd [at] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'in %s',
            past: '%s ago',
            s: 'a few seconds',
            ss: '%d seconds',
            m: 'a minute',
            mm: '%d minutes',
            h: 'an hour',
            hh: '%d hours',
            d: 'a day',
            dd: '%d days',
            M: 'a month',
            MM: '%d months',
            y: 'a year',
            yy: '%d years',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal: function (number) {
            var b = number % 10,
                output =
                    ~~((number % 100) / 10) === 1
                        ? 'th'
                        : b === 1
                            ? 'st'
                            : b === 2
                                ? 'nd'
                                : b === 3
                                    ? 'rd'
                                    : 'th';
            return number + output;
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('en-ie', {
        months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
            '_'
        ),
        monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
            '_'
        ),
        weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Today at] LT',
            nextDay: '[Tomorrow at] LT',
            nextWeek: 'dddd [at] LT',
            lastDay: '[Yesterday at] LT',
            lastWeek: '[Last] dddd [at] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'in %s',
            past: '%s ago',
            s: 'a few seconds',
            ss: '%d seconds',
            m: 'a minute',
            mm: '%d minutes',
            h: 'an hour',
            hh: '%d hours',
            d: 'a day',
            dd: '%d days',
            M: 'a month',
            MM: '%d months',
            y: 'a year',
            yy: '%d years',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal: function (number) {
            var b = number % 10,
                output =
                    ~~((number % 100) / 10) === 1
                        ? 'th'
                        : b === 1
                            ? 'st'
                            : b === 2
                                ? 'nd'
                                : b === 3
                                    ? 'rd'
                                    : 'th';
            return number + output;
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('en-il', {
        months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
            '_'
        ),
        monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
            '_'
        ),
        weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Today at] LT',
            nextDay: '[Tomorrow at] LT',
            nextWeek: 'dddd [at] LT',
            lastDay: '[Yesterday at] LT',
            lastWeek: '[Last] dddd [at] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'in %s',
            past: '%s ago',
            s: 'a few seconds',
            ss: '%d seconds',
            m: 'a minute',
            mm: '%d minutes',
            h: 'an hour',
            hh: '%d hours',
            d: 'a day',
            dd: '%d days',
            M: 'a month',
            MM: '%d months',
            y: 'a year',
            yy: '%d years',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal: function (number) {
            var b = number % 10,
                output =
                    ~~((number % 100) / 10) === 1
                        ? 'th'
                        : b === 1
                            ? 'st'
                            : b === 2
                                ? 'nd'
                                : b === 3
                                    ? 'rd'
                                    : 'th';
            return number + output;
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('en-in', {
        months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
            '_'
        ),
        monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
            '_'
        ),
        weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat: {
            LT: 'h:mm A',
            LTS: 'h:mm:ss A',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY h:mm A',
            LLLL: 'dddd, D MMMM YYYY h:mm A',
        },
        calendar: {
            sameDay: '[Today at] LT',
            nextDay: '[Tomorrow at] LT',
            nextWeek: 'dddd [at] LT',
            lastDay: '[Yesterday at] LT',
            lastWeek: '[Last] dddd [at] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'in %s',
            past: '%s ago',
            s: 'a few seconds',
            ss: '%d seconds',
            m: 'a minute',
            mm: '%d minutes',
            h: 'an hour',
            hh: '%d hours',
            d: 'a day',
            dd: '%d days',
            M: 'a month',
            MM: '%d months',
            y: 'a year',
            yy: '%d years',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal: function (number) {
            var b = number % 10,
                output =
                    ~~((number % 100) / 10) === 1
                        ? 'th'
                        : b === 1
                            ? 'st'
                            : b === 2
                                ? 'nd'
                                : b === 3
                                    ? 'rd'
                                    : 'th';
            return number + output;
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 6, // The week that contains Jan 1st is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('en-nz', {
        months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
            '_'
        ),
        monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
            '_'
        ),
        weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat: {
            LT: 'h:mm A',
            LTS: 'h:mm:ss A',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY h:mm A',
            LLLL: 'dddd, D MMMM YYYY h:mm A',
        },
        calendar: {
            sameDay: '[Today at] LT',
            nextDay: '[Tomorrow at] LT',
            nextWeek: 'dddd [at] LT',
            lastDay: '[Yesterday at] LT',
            lastWeek: '[Last] dddd [at] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'in %s',
            past: '%s ago',
            s: 'a few seconds',
            ss: '%d seconds',
            m: 'a minute',
            mm: '%d minutes',
            h: 'an hour',
            hh: '%d hours',
            d: 'a day',
            dd: '%d days',
            M: 'a month',
            MM: '%d months',
            y: 'a year',
            yy: '%d years',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal: function (number) {
            var b = number % 10,
                output =
                    ~~((number % 100) / 10) === 1
                        ? 'th'
                        : b === 1
                            ? 'st'
                            : b === 2
                                ? 'nd'
                                : b === 3
                                    ? 'rd'
                                    : 'th';
            return number + output;
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('en-sg', {
        months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
            '_'
        ),
        monthsShort: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
            '_'
        ),
        weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Today at] LT',
            nextDay: '[Tomorrow at] LT',
            nextWeek: 'dddd [at] LT',
            lastDay: '[Yesterday at] LT',
            lastWeek: '[Last] dddd [at] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'in %s',
            past: '%s ago',
            s: 'a few seconds',
            ss: '%d seconds',
            m: 'a minute',
            mm: '%d minutes',
            h: 'an hour',
            hh: '%d hours',
            d: 'a day',
            dd: '%d days',
            M: 'a month',
            MM: '%d months',
            y: 'a year',
            yy: '%d years',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal: function (number) {
            var b = number % 10,
                output =
                    ~~((number % 100) / 10) === 1
                        ? 'th'
                        : b === 1
                            ? 'st'
                            : b === 2
                                ? 'nd'
                                : b === 3
                                    ? 'rd'
                                    : 'th';
            return number + output;
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('eo', {
        months: 'januaro_februaro_marto_aprilo_majo_junio_julio_a큼gusto_septembro_oktobro_novembro_decembro'.split(
            '_'
        ),
        monthsShort: 'jan_feb_mart_apr_maj_jun_jul_a큼g_sept_okt_nov_dec'.split('_'),
        weekdays: 'diman훸o_lundo_mardo_merkredo_캔a큼do_vendredo_sabato'.split('_'),
        weekdaysShort: 'dim_lun_mard_merk_캔a큼_ven_sab'.split('_'),
        weekdaysMin: 'di_lu_ma_me_캔a_ve_sa'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'YYYY-MM-DD',
            LL: '[la] D[-an de] MMMM, YYYY',
            LLL: '[la] D[-an de] MMMM, YYYY HH:mm',
            LLLL: 'dddd[n], [la] D[-an de] MMMM, YYYY HH:mm',
            llll: 'ddd, [la] D[-an de] MMM, YYYY HH:mm',
        },
        meridiemParse: /[ap]\.t\.m/i,
        isPM: function (input) {
            return input.charAt(0).toLowerCase() === 'p';
        },
        meridiem: function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'p.t.m.' : 'P.T.M.';
            } else {
                return isLower ? 'a.t.m.' : 'A.T.M.';
            }
        },
        calendar: {
            sameDay: '[Hodia큼 je] LT',
            nextDay: '[Morga큼 je] LT',
            nextWeek: 'dddd[n je] LT',
            lastDay: '[Hiera큼 je] LT',
            lastWeek: '[pasintan] dddd[n je] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'post %s',
            past: 'anta큼 %s',
            s: 'kelkaj sekundoj',
            ss: '%d sekundoj',
            m: 'unu minuto',
            mm: '%d minutoj',
            h: 'unu horo',
            hh: '%d horoj',
            d: 'unu tago', //ne 'diurno', 훸ar estas uzita por proksimumo
            dd: '%d tagoj',
            M: 'unu monato',
            MM: '%d monatoj',
            y: 'unu jaro',
            yy: '%d jaroj',
        },
        dayOfMonthOrdinalParse: /\d{1,2}a/,
        ordinal: '%da',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var monthsShortDot = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split(
            '_'
        ),
        monthsShort$1 = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split('_'),
        monthsParse$2 = [
            /^ene/i,
            /^feb/i,
            /^mar/i,
            /^abr/i,
            /^may/i,
            /^jun/i,
            /^jul/i,
            /^ago/i,
            /^sep/i,
            /^oct/i,
            /^nov/i,
            /^dic/i,
        ],
        monthsRegex$3 = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i;

    hooks.defineLocale('es-do', {
        months: 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split(
            '_'
        ),
        monthsShort: function (m, format) {
            if (!m) {
                return monthsShortDot;
            } else if (/-MMM-/.test(format)) {
                return monthsShort$1[m.month()];
            } else {
                return monthsShortDot[m.month()];
            }
        },
        monthsRegex: monthsRegex$3,
        monthsShortRegex: monthsRegex$3,
        monthsStrictRegex: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
        monthsShortStrictRegex: /^(ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i,
        monthsParse: monthsParse$2,
        longMonthsParse: monthsParse$2,
        shortMonthsParse: monthsParse$2,
        weekdays: 'domingo_lunes_martes_mi챕rcoles_jueves_viernes_s찼bado'.split('_'),
        weekdaysShort: 'dom._lun._mar._mi챕._jue._vie._s찼b.'.split('_'),
        weekdaysMin: 'do_lu_ma_mi_ju_vi_s찼'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'h:mm A',
            LTS: 'h:mm:ss A',
            L: 'DD/MM/YYYY',
            LL: 'D [de] MMMM [de] YYYY',
            LLL: 'D [de] MMMM [de] YYYY h:mm A',
            LLLL: 'dddd, D [de] MMMM [de] YYYY h:mm A',
        },
        calendar: {
            sameDay: function () {
                return '[hoy a la' + (this.hours() !== 1 ? 's' : '') + '] LT';
            },
            nextDay: function () {
                return '[ma챰ana a la' + (this.hours() !== 1 ? 's' : '') + '] LT';
            },
            nextWeek: function () {
                return 'dddd [a la' + (this.hours() !== 1 ? 's' : '') + '] LT';
            },
            lastDay: function () {
                return '[ayer a la' + (this.hours() !== 1 ? 's' : '') + '] LT';
            },
            lastWeek: function () {
                return (
                    '[el] dddd [pasado a la' +
                    (this.hours() !== 1 ? 's' : '') +
                    '] LT'
                );
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: 'en %s',
            past: 'hace %s',
            s: 'unos segundos',
            ss: '%d segundos',
            m: 'un minuto',
            mm: '%d minutos',
            h: 'una hora',
            hh: '%d horas',
            d: 'un d챠a',
            dd: '%d d챠as',
            w: 'una semana',
            ww: '%d semanas',
            M: 'un mes',
            MM: '%d meses',
            y: 'un a챰o',
            yy: '%d a챰os',
        },
        dayOfMonthOrdinalParse: /\d{1,2}쨘/,
        ordinal: '%d쨘',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var monthsShortDot$1 = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split(
            '_'
        ),
        monthsShort$2 = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split('_'),
        monthsParse$3 = [
            /^ene/i,
            /^feb/i,
            /^mar/i,
            /^abr/i,
            /^may/i,
            /^jun/i,
            /^jul/i,
            /^ago/i,
            /^sep/i,
            /^oct/i,
            /^nov/i,
            /^dic/i,
        ],
        monthsRegex$4 = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i;

    hooks.defineLocale('es-mx', {
        months: 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split(
            '_'
        ),
        monthsShort: function (m, format) {
            if (!m) {
                return monthsShortDot$1;
            } else if (/-MMM-/.test(format)) {
                return monthsShort$2[m.month()];
            } else {
                return monthsShortDot$1[m.month()];
            }
        },
        monthsRegex: monthsRegex$4,
        monthsShortRegex: monthsRegex$4,
        monthsStrictRegex: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
        monthsShortStrictRegex: /^(ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i,
        monthsParse: monthsParse$3,
        longMonthsParse: monthsParse$3,
        shortMonthsParse: monthsParse$3,
        weekdays: 'domingo_lunes_martes_mi챕rcoles_jueves_viernes_s찼bado'.split('_'),
        weekdaysShort: 'dom._lun._mar._mi챕._jue._vie._s찼b.'.split('_'),
        weekdaysMin: 'do_lu_ma_mi_ju_vi_s찼'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D [de] MMMM [de] YYYY',
            LLL: 'D [de] MMMM [de] YYYY H:mm',
            LLLL: 'dddd, D [de] MMMM [de] YYYY H:mm',
        },
        calendar: {
            sameDay: function () {
                return '[hoy a la' + (this.hours() !== 1 ? 's' : '') + '] LT';
            },
            nextDay: function () {
                return '[ma챰ana a la' + (this.hours() !== 1 ? 's' : '') + '] LT';
            },
            nextWeek: function () {
                return 'dddd [a la' + (this.hours() !== 1 ? 's' : '') + '] LT';
            },
            lastDay: function () {
                return '[ayer a la' + (this.hours() !== 1 ? 's' : '') + '] LT';
            },
            lastWeek: function () {
                return (
                    '[el] dddd [pasado a la' +
                    (this.hours() !== 1 ? 's' : '') +
                    '] LT'
                );
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: 'en %s',
            past: 'hace %s',
            s: 'unos segundos',
            ss: '%d segundos',
            m: 'un minuto',
            mm: '%d minutos',
            h: 'una hora',
            hh: '%d horas',
            d: 'un d챠a',
            dd: '%d d챠as',
            w: 'una semana',
            ww: '%d semanas',
            M: 'un mes',
            MM: '%d meses',
            y: 'un a챰o',
            yy: '%d a챰os',
        },
        dayOfMonthOrdinalParse: /\d{1,2}쨘/,
        ordinal: '%d쨘',
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
        invalidDate: 'Fecha inv찼lida',
    });

    //! moment.js locale configuration

    var monthsShortDot$2 = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split(
            '_'
        ),
        monthsShort$3 = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split('_'),
        monthsParse$4 = [
            /^ene/i,
            /^feb/i,
            /^mar/i,
            /^abr/i,
            /^may/i,
            /^jun/i,
            /^jul/i,
            /^ago/i,
            /^sep/i,
            /^oct/i,
            /^nov/i,
            /^dic/i,
        ],
        monthsRegex$5 = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i;

    hooks.defineLocale('es-us', {
        months: 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split(
            '_'
        ),
        monthsShort: function (m, format) {
            if (!m) {
                return monthsShortDot$2;
            } else if (/-MMM-/.test(format)) {
                return monthsShort$3[m.month()];
            } else {
                return monthsShortDot$2[m.month()];
            }
        },
        monthsRegex: monthsRegex$5,
        monthsShortRegex: monthsRegex$5,
        monthsStrictRegex: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
        monthsShortStrictRegex: /^(ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i,
        monthsParse: monthsParse$4,
        longMonthsParse: monthsParse$4,
        shortMonthsParse: monthsParse$4,
        weekdays: 'domingo_lunes_martes_mi챕rcoles_jueves_viernes_s찼bado'.split('_'),
        weekdaysShort: 'dom._lun._mar._mi챕._jue._vie._s찼b.'.split('_'),
        weekdaysMin: 'do_lu_ma_mi_ju_vi_s찼'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'h:mm A',
            LTS: 'h:mm:ss A',
            L: 'MM/DD/YYYY',
            LL: 'D [de] MMMM [de] YYYY',
            LLL: 'D [de] MMMM [de] YYYY h:mm A',
            LLLL: 'dddd, D [de] MMMM [de] YYYY h:mm A',
        },
        calendar: {
            sameDay: function () {
                return '[hoy a la' + (this.hours() !== 1 ? 's' : '') + '] LT';
            },
            nextDay: function () {
                return '[ma챰ana a la' + (this.hours() !== 1 ? 's' : '') + '] LT';
            },
            nextWeek: function () {
                return 'dddd [a la' + (this.hours() !== 1 ? 's' : '') + '] LT';
            },
            lastDay: function () {
                return '[ayer a la' + (this.hours() !== 1 ? 's' : '') + '] LT';
            },
            lastWeek: function () {
                return (
                    '[el] dddd [pasado a la' +
                    (this.hours() !== 1 ? 's' : '') +
                    '] LT'
                );
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: 'en %s',
            past: 'hace %s',
            s: 'unos segundos',
            ss: '%d segundos',
            m: 'un minuto',
            mm: '%d minutos',
            h: 'una hora',
            hh: '%d horas',
            d: 'un d챠a',
            dd: '%d d챠as',
            w: 'una semana',
            ww: '%d semanas',
            M: 'un mes',
            MM: '%d meses',
            y: 'un a챰o',
            yy: '%d a챰os',
        },
        dayOfMonthOrdinalParse: /\d{1,2}쨘/,
        ordinal: '%d쨘',
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 6, // The week that contains Jan 6th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var monthsShortDot$3 = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split(
            '_'
        ),
        monthsShort$4 = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split('_'),
        monthsParse$5 = [
            /^ene/i,
            /^feb/i,
            /^mar/i,
            /^abr/i,
            /^may/i,
            /^jun/i,
            /^jul/i,
            /^ago/i,
            /^sep/i,
            /^oct/i,
            /^nov/i,
            /^dic/i,
        ],
        monthsRegex$6 = /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i;

    hooks.defineLocale('es', {
        months: 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split(
            '_'
        ),
        monthsShort: function (m, format) {
            if (!m) {
                return monthsShortDot$3;
            } else if (/-MMM-/.test(format)) {
                return monthsShort$4[m.month()];
            } else {
                return monthsShortDot$3[m.month()];
            }
        },
        monthsRegex: monthsRegex$6,
        monthsShortRegex: monthsRegex$6,
        monthsStrictRegex: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
        monthsShortStrictRegex: /^(ene\.?|feb\.?|mar\.?|abr\.?|may\.?|jun\.?|jul\.?|ago\.?|sep\.?|oct\.?|nov\.?|dic\.?)/i,
        monthsParse: monthsParse$5,
        longMonthsParse: monthsParse$5,
        shortMonthsParse: monthsParse$5,
        weekdays: 'domingo_lunes_martes_mi챕rcoles_jueves_viernes_s찼bado'.split('_'),
        weekdaysShort: 'dom._lun._mar._mi챕._jue._vie._s찼b.'.split('_'),
        weekdaysMin: 'do_lu_ma_mi_ju_vi_s찼'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D [de] MMMM [de] YYYY',
            LLL: 'D [de] MMMM [de] YYYY H:mm',
            LLLL: 'dddd, D [de] MMMM [de] YYYY H:mm',
        },
        calendar: {
            sameDay: function () {
                return '[hoy a la' + (this.hours() !== 1 ? 's' : '') + '] LT';
            },
            nextDay: function () {
                return '[ma챰ana a la' + (this.hours() !== 1 ? 's' : '') + '] LT';
            },
            nextWeek: function () {
                return 'dddd [a la' + (this.hours() !== 1 ? 's' : '') + '] LT';
            },
            lastDay: function () {
                return '[ayer a la' + (this.hours() !== 1 ? 's' : '') + '] LT';
            },
            lastWeek: function () {
                return (
                    '[el] dddd [pasado a la' +
                    (this.hours() !== 1 ? 's' : '') +
                    '] LT'
                );
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: 'en %s',
            past: 'hace %s',
            s: 'unos segundos',
            ss: '%d segundos',
            m: 'un minuto',
            mm: '%d minutos',
            h: 'una hora',
            hh: '%d horas',
            d: 'un d챠a',
            dd: '%d d챠as',
            w: 'una semana',
            ww: '%d semanas',
            M: 'un mes',
            MM: '%d meses',
            y: 'un a챰o',
            yy: '%d a챰os',
        },
        dayOfMonthOrdinalParse: /\d{1,2}쨘/,
        ordinal: '%d쨘',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
        invalidDate: 'Fecha inv찼lida',
    });

    //! moment.js locale configuration

    function processRelativeTime$3(number, withoutSuffix, key, isFuture) {
        var format = {
            s: ['m천ne sekundi', 'm천ni sekund', 'paar sekundit'],
            ss: [number + 'sekundi', number + 'sekundit'],
            m: ['체he minuti', '체ks minut'],
            mm: [number + ' minuti', number + ' minutit'],
            h: ['체he tunni', 'tund aega', '체ks tund'],
            hh: [number + ' tunni', number + ' tundi'],
            d: ['체he p채eva', '체ks p채ev'],
            M: ['kuu aja', 'kuu aega', '체ks kuu'],
            MM: [number + ' kuu', number + ' kuud'],
            y: ['체he aasta', 'aasta', '체ks aasta'],
            yy: [number + ' aasta', number + ' aastat'],
        };
        if (withoutSuffix) {
            return format[key][2] ? format[key][2] : format[key][1];
        }
        return isFuture ? format[key][0] : format[key][1];
    }

    hooks.defineLocale('et', {
        months: 'jaanuar_veebruar_m채rts_aprill_mai_juuni_juuli_august_september_oktoober_november_detsember'.split(
            '_'
        ),
        monthsShort: 'jaan_veebr_m채rts_apr_mai_juuni_juuli_aug_sept_okt_nov_dets'.split(
            '_'
        ),
        weekdays: 'p체hap채ev_esmasp채ev_teisip채ev_kolmap채ev_neljap채ev_reede_laup채ev'.split(
            '_'
        ),
        weekdaysShort: 'P_E_T_K_N_R_L'.split('_'),
        weekdaysMin: 'P_E_T_K_N_R_L'.split('_'),
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY H:mm',
            LLLL: 'dddd, D. MMMM YYYY H:mm',
        },
        calendar: {
            sameDay: '[T채na,] LT',
            nextDay: '[Homme,] LT',
            nextWeek: '[J채rgmine] dddd LT',
            lastDay: '[Eile,] LT',
            lastWeek: '[Eelmine] dddd LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s p채rast',
            past: '%s tagasi',
            s: processRelativeTime$3,
            ss: processRelativeTime$3,
            m: processRelativeTime$3,
            mm: processRelativeTime$3,
            h: processRelativeTime$3,
            hh: processRelativeTime$3,
            d: processRelativeTime$3,
            dd: '%d p채eva',
            M: processRelativeTime$3,
            MM: processRelativeTime$3,
            y: processRelativeTime$3,
            yy: processRelativeTime$3,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('eu', {
        months: 'urtarrila_otsaila_martxoa_apirila_maiatza_ekaina_uztaila_abuztua_iraila_urria_azaroa_abendua'.split(
            '_'
        ),
        monthsShort: 'urt._ots._mar._api._mai._eka._uzt._abu._ira._urr._aza._abe.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'igandea_astelehena_asteartea_asteazkena_osteguna_ostirala_larunbata'.split(
            '_'
        ),
        weekdaysShort: 'ig._al._ar._az._og._ol._lr.'.split('_'),
        weekdaysMin: 'ig_al_ar_az_og_ol_lr'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'YYYY-MM-DD',
            LL: 'YYYY[ko] MMMM[ren] D[a]',
            LLL: 'YYYY[ko] MMMM[ren] D[a] HH:mm',
            LLLL: 'dddd, YYYY[ko] MMMM[ren] D[a] HH:mm',
            l: 'YYYY-M-D',
            ll: 'YYYY[ko] MMM D[a]',
            lll: 'YYYY[ko] MMM D[a] HH:mm',
            llll: 'ddd, YYYY[ko] MMM D[a] HH:mm',
        },
        calendar: {
            sameDay: '[gaur] LT[etan]',
            nextDay: '[bihar] LT[etan]',
            nextWeek: 'dddd LT[etan]',
            lastDay: '[atzo] LT[etan]',
            lastWeek: '[aurreko] dddd LT[etan]',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s barru',
            past: 'duela %s',
            s: 'segundo batzuk',
            ss: '%d segundo',
            m: 'minutu bat',
            mm: '%d minutu',
            h: 'ordu bat',
            hh: '%d ordu',
            d: 'egun bat',
            dd: '%d egun',
            M: 'hilabete bat',
            MM: '%d hilabete',
            y: 'urte bat',
            yy: '%d urte',
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var symbolMap$6 = {
            1: '旁',
            2: '昉',
            3: '枋',
            4: '榜',
            5: '滂',
            6: '磅',
            7: '紡',
            8: '肪',
            9: '膀',
            0: '方',
        },
        numberMap$5 = {
            '旁': '1',
            '昉': '2',
            '枋': '3',
            '榜': '4',
            '滂': '5',
            '磅': '6',
            '紡': '7',
            '肪': '8',
            '膀': '9',
            '方': '0',
        };

    hooks.defineLocale('fa', {
        months: '�碼����_��邈��_�碼邈卍_笠�邈��_��_��痲�_��痲��_碼�魔_卍毛魔碼�磨邈_碼沕魔磨邈_��碼�磨邈_膜卍碼�磨邈'.split(
            '_'
        ),
        monthsShort: '�碼����_��邈��_�碼邈卍_笠�邈��_��_��痲�_��痲��_碼�魔_卍毛魔碼�磨邈_碼沕魔磨邈_��碼�磨邈_膜卍碼�磨邈'.split(
            '_'
        ),
        weekdays: '�沕\u200c娩�磨�_膜�娩�磨�_卍�\u200c娩�磨�_��碼邈娩�磨�_毛�寞\u200c娩�磨�_寞�晩�_娩�磨�'.split(
            '_'
        ),
        weekdaysShort: '�沕\u200c娩�磨�_膜�娩�磨�_卍�\u200c娩�磨�_��碼邈娩�磨�_毛�寞\u200c娩�磨�_寞�晩�_娩�磨�'.split(
            '_'
        ),
        weekdaysMin: '�_膜_卍_�_毛_寞_娩'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        meridiemParse: /�磨� 碼万 挽�邈|磨晩膜 碼万 挽�邈/,
        isPM: function (input) {
            return /磨晩膜 碼万 挽�邈/.test(input);
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 12) {
                return '�磨� 碼万 挽�邈';
            } else {
                return '磨晩膜 碼万 挽�邈';
            }
        },
        calendar: {
            sameDay: '[碼�邈�万 卍碼晩魔] LT',
            nextDay: '[�邈膜碼 卍碼晩魔] LT',
            nextWeek: 'dddd [卍碼晩魔] LT',
            lastDay: '[膜�邈�万 卍碼晩魔] LT',
            lastWeek: 'dddd [毛�娩] [卍碼晩魔] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '膜邈 %s',
            past: '%s 毛�娩',
            s: '��膜 麻碼���',
            ss: '%d 麻碼���',
            m: '�沕 膜����',
            mm: '%d 膜����',
            h: '�沕 卍碼晩魔',
            hh: '%d 卍碼晩魔',
            d: '�沕 邈�万',
            dd: '%d 邈�万',
            M: '�沕 �碼�',
            MM: '%d �碼�',
            y: '�沕 卍碼�',
            yy: '%d 卍碼�',
        },
        preparse: function (string) {
            return string
                .replace(/[方-膀]/g, function (match) {
                    return numberMap$5[match];
                })
                .replace(/�/g, ',');
        },
        postformat: function (string) {
            return string
                .replace(/\d/g, function (match) {
                    return symbolMap$6[match];
                })
                .replace(/,/g, '�');
        },
        dayOfMonthOrdinalParse: /\d{1,2}�/,
        ordinal: '%d�',
        week: {
            dow: 6, // Saturday is the first day of the week.
            doy: 12, // The week that contains Jan 12th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var numbersPast = 'nolla yksi kaksi kolme nelj채 viisi kuusi seitsem채n kahdeksan yhdeks채n'.split(
            ' '
        ),
        numbersFuture = [
            'nolla',
            'yhden',
            'kahden',
            'kolmen',
            'nelj채n',
            'viiden',
            'kuuden',
            numbersPast[7],
            numbersPast[8],
            numbersPast[9],
        ];
    function translate$2(number, withoutSuffix, key, isFuture) {
        var result = '';
        switch (key) {
            case 's':
                return isFuture ? 'muutaman sekunnin' : 'muutama sekunti';
            case 'ss':
                result = isFuture ? 'sekunnin' : 'sekuntia';
                break;
            case 'm':
                return isFuture ? 'minuutin' : 'minuutti';
            case 'mm':
                result = isFuture ? 'minuutin' : 'minuuttia';
                break;
            case 'h':
                return isFuture ? 'tunnin' : 'tunti';
            case 'hh':
                result = isFuture ? 'tunnin' : 'tuntia';
                break;
            case 'd':
                return isFuture ? 'p채iv채n' : 'p채iv채';
            case 'dd':
                result = isFuture ? 'p채iv채n' : 'p채iv채채';
                break;
            case 'M':
                return isFuture ? 'kuukauden' : 'kuukausi';
            case 'MM':
                result = isFuture ? 'kuukauden' : 'kuukautta';
                break;
            case 'y':
                return isFuture ? 'vuoden' : 'vuosi';
            case 'yy':
                result = isFuture ? 'vuoden' : 'vuotta';
                break;
        }
        result = verbalNumber(number, isFuture) + ' ' + result;
        return result;
    }
    function verbalNumber(number, isFuture) {
        return number < 10
            ? isFuture
                ? numbersFuture[number]
                : numbersPast[number]
            : number;
    }

    hooks.defineLocale('fi', {
        months: 'tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kes채kuu_hein채kuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu'.split(
            '_'
        ),
        monthsShort: 'tammi_helmi_maalis_huhti_touko_kes채_hein채_elo_syys_loka_marras_joulu'.split(
            '_'
        ),
        weekdays: 'sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai'.split(
            '_'
        ),
        weekdaysShort: 'su_ma_ti_ke_to_pe_la'.split('_'),
        weekdaysMin: 'su_ma_ti_ke_to_pe_la'.split('_'),
        longDateFormat: {
            LT: 'HH.mm',
            LTS: 'HH.mm.ss',
            L: 'DD.MM.YYYY',
            LL: 'Do MMMM[ta] YYYY',
            LLL: 'Do MMMM[ta] YYYY, [klo] HH.mm',
            LLLL: 'dddd, Do MMMM[ta] YYYY, [klo] HH.mm',
            l: 'D.M.YYYY',
            ll: 'Do MMM YYYY',
            lll: 'Do MMM YYYY, [klo] HH.mm',
            llll: 'ddd, Do MMM YYYY, [klo] HH.mm',
        },
        calendar: {
            sameDay: '[t채n채채n] [klo] LT',
            nextDay: '[huomenna] [klo] LT',
            nextWeek: 'dddd [klo] LT',
            lastDay: '[eilen] [klo] LT',
            lastWeek: '[viime] dddd[na] [klo] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s p채채st채',
            past: '%s sitten',
            s: translate$2,
            ss: translate$2,
            m: translate$2,
            mm: translate$2,
            h: translate$2,
            hh: translate$2,
            d: translate$2,
            dd: translate$2,
            M: translate$2,
            MM: translate$2,
            y: translate$2,
            yy: translate$2,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('fil', {
        months: 'Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre'.split(
            '_'
        ),
        monthsShort: 'Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis'.split('_'),
        weekdays: 'Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado'.split(
            '_'
        ),
        weekdaysShort: 'Lin_Lun_Mar_Miy_Huw_Biy_Sab'.split('_'),
        weekdaysMin: 'Li_Lu_Ma_Mi_Hu_Bi_Sab'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'MM/D/YYYY',
            LL: 'MMMM D, YYYY',
            LLL: 'MMMM D, YYYY HH:mm',
            LLLL: 'dddd, MMMM DD, YYYY HH:mm',
        },
        calendar: {
            sameDay: 'LT [ngayong araw]',
            nextDay: '[Bukas ng] LT',
            nextWeek: 'LT [sa susunod na] dddd',
            lastDay: 'LT [kahapon]',
            lastWeek: 'LT [noong nakaraang] dddd',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'sa loob ng %s',
            past: '%s ang nakalipas',
            s: 'ilang segundo',
            ss: '%d segundo',
            m: 'isang minuto',
            mm: '%d minuto',
            h: 'isang oras',
            hh: '%d oras',
            d: 'isang araw',
            dd: '%d araw',
            M: 'isang buwan',
            MM: '%d buwan',
            y: 'isang taon',
            yy: '%d taon',
        },
        dayOfMonthOrdinalParse: /\d{1,2}/,
        ordinal: function (number) {
            return number;
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('fo', {
        months: 'januar_februar_mars_apr챠l_mai_juni_juli_august_september_oktober_november_desember'.split(
            '_'
        ),
        monthsShort: 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
        weekdays: 'sunnudagur_m찼nadagur_t첵sdagur_mikudagur_h처sdagur_fr챠ggjadagur_leygardagur'.split(
            '_'
        ),
        weekdaysShort: 'sun_m찼n_t첵s_mik_h처s_fr챠_ley'.split('_'),
        weekdaysMin: 'su_m찼_t첵_mi_h처_fr_le'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D. MMMM, YYYY HH:mm',
        },
        calendar: {
            sameDay: '[횒 dag kl.] LT',
            nextDay: '[횒 morgin kl.] LT',
            nextWeek: 'dddd [kl.] LT',
            lastDay: '[횒 gj찼r kl.] LT',
            lastWeek: '[s챠챨stu] dddd [kl] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'um %s',
            past: '%s s챠챨ani',
            s: 'f찼 sekund',
            ss: '%d sekundir',
            m: 'ein minuttur',
            mm: '%d minuttir',
            h: 'ein t챠mi',
            hh: '%d t챠mar',
            d: 'ein dagur',
            dd: '%d dagar',
            M: 'ein m찼na챨ur',
            MM: '%d m찼na챨ir',
            y: 'eitt 찼r',
            yy: '%d 찼r',
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('fr-ca', {
        months: 'janvier_f챕vrier_mars_avril_mai_juin_juillet_ao청t_septembre_octobre_novembre_d챕cembre'.split(
            '_'
        ),
        monthsShort: 'janv._f챕vr._mars_avr._mai_juin_juil._ao청t_sept._oct._nov._d챕c.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
        weekdaysShort: 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
        weekdaysMin: 'di_lu_ma_me_je_ve_sa'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'YYYY-MM-DD',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Aujourd�셡ui 횪] LT',
            nextDay: '[Demain 횪] LT',
            nextWeek: 'dddd [횪] LT',
            lastDay: '[Hier 횪] LT',
            lastWeek: 'dddd [dernier 횪] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'dans %s',
            past: 'il y a %s',
            s: 'quelques secondes',
            ss: '%d secondes',
            m: 'une minute',
            mm: '%d minutes',
            h: 'une heure',
            hh: '%d heures',
            d: 'un jour',
            dd: '%d jours',
            M: 'un mois',
            MM: '%d mois',
            y: 'un an',
            yy: '%d ans',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(er|e)/,
        ordinal: function (number, period) {
            switch (period) {
                // Words with masculine grammatical gender: mois, trimestre, jour
                default:
                case 'M':
                case 'Q':
                case 'D':
                case 'DDD':
                case 'd':
                    return number + (number === 1 ? 'er' : 'e');

                // Words with feminine grammatical gender: semaine
                case 'w':
                case 'W':
                    return number + (number === 1 ? 're' : 'e');
            }
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('fr-ch', {
        months: 'janvier_f챕vrier_mars_avril_mai_juin_juillet_ao청t_septembre_octobre_novembre_d챕cembre'.split(
            '_'
        ),
        monthsShort: 'janv._f챕vr._mars_avr._mai_juin_juil._ao청t_sept._oct._nov._d챕c.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
        weekdaysShort: 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
        weekdaysMin: 'di_lu_ma_me_je_ve_sa'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Aujourd�셡ui 횪] LT',
            nextDay: '[Demain 횪] LT',
            nextWeek: 'dddd [횪] LT',
            lastDay: '[Hier 횪] LT',
            lastWeek: 'dddd [dernier 횪] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'dans %s',
            past: 'il y a %s',
            s: 'quelques secondes',
            ss: '%d secondes',
            m: 'une minute',
            mm: '%d minutes',
            h: 'une heure',
            hh: '%d heures',
            d: 'un jour',
            dd: '%d jours',
            M: 'un mois',
            MM: '%d mois',
            y: 'un an',
            yy: '%d ans',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(er|e)/,
        ordinal: function (number, period) {
            switch (period) {
                // Words with masculine grammatical gender: mois, trimestre, jour
                default:
                case 'M':
                case 'Q':
                case 'D':
                case 'DDD':
                case 'd':
                    return number + (number === 1 ? 'er' : 'e');

                // Words with feminine grammatical gender: semaine
                case 'w':
                case 'W':
                    return number + (number === 1 ? 're' : 'e');
            }
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var monthsStrictRegex$1 = /^(janvier|f챕vrier|mars|avril|mai|juin|juillet|ao청t|septembre|octobre|novembre|d챕cembre)/i,
        monthsShortStrictRegex$1 = /(janv\.?|f챕vr\.?|mars|avr\.?|mai|juin|juil\.?|ao청t|sept\.?|oct\.?|nov\.?|d챕c\.?)/i,
        monthsRegex$7 = /(janv\.?|f챕vr\.?|mars|avr\.?|mai|juin|juil\.?|ao청t|sept\.?|oct\.?|nov\.?|d챕c\.?|janvier|f챕vrier|mars|avril|mai|juin|juillet|ao청t|septembre|octobre|novembre|d챕cembre)/i,
        monthsParse$6 = [
            /^janv/i,
            /^f챕vr/i,
            /^mars/i,
            /^avr/i,
            /^mai/i,
            /^juin/i,
            /^juil/i,
            /^ao청t/i,
            /^sept/i,
            /^oct/i,
            /^nov/i,
            /^d챕c/i,
        ];

    hooks.defineLocale('fr', {
        months: 'janvier_f챕vrier_mars_avril_mai_juin_juillet_ao청t_septembre_octobre_novembre_d챕cembre'.split(
            '_'
        ),
        monthsShort: 'janv._f챕vr._mars_avr._mai_juin_juil._ao청t_sept._oct._nov._d챕c.'.split(
            '_'
        ),
        monthsRegex: monthsRegex$7,
        monthsShortRegex: monthsRegex$7,
        monthsStrictRegex: monthsStrictRegex$1,
        monthsShortStrictRegex: monthsShortStrictRegex$1,
        monthsParse: monthsParse$6,
        longMonthsParse: monthsParse$6,
        shortMonthsParse: monthsParse$6,
        weekdays: 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
        weekdaysShort: 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
        weekdaysMin: 'di_lu_ma_me_je_ve_sa'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Aujourd�셡ui 횪] LT',
            nextDay: '[Demain 횪] LT',
            nextWeek: 'dddd [횪] LT',
            lastDay: '[Hier 횪] LT',
            lastWeek: 'dddd [dernier 횪] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'dans %s',
            past: 'il y a %s',
            s: 'quelques secondes',
            ss: '%d secondes',
            m: 'une minute',
            mm: '%d minutes',
            h: 'une heure',
            hh: '%d heures',
            d: 'un jour',
            dd: '%d jours',
            w: 'une semaine',
            ww: '%d semaines',
            M: 'un mois',
            MM: '%d mois',
            y: 'un an',
            yy: '%d ans',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(er|)/,
        ordinal: function (number, period) {
            switch (period) {
                // TODO: Return 'e' when day of month > 1. Move this case inside
                // block for masculine words below.
                // See https://github.com/moment/moment/issues/3375
                case 'D':
                    return number + (number === 1 ? 'er' : '');

                // Words with masculine grammatical gender: mois, trimestre, jour
                default:
                case 'M':
                case 'Q':
                case 'DDD':
                case 'd':
                    return number + (number === 1 ? 'er' : 'e');

                // Words with feminine grammatical gender: semaine
                case 'w':
                case 'W':
                    return number + (number === 1 ? 're' : 'e');
            }
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var monthsShortWithDots = 'jan._feb._mrt._apr._mai_jun._jul._aug._sep._okt._nov._des.'.split(
            '_'
        ),
        monthsShortWithoutDots = 'jan_feb_mrt_apr_mai_jun_jul_aug_sep_okt_nov_des'.split(
            '_'
        );

    hooks.defineLocale('fy', {
        months: 'jannewaris_febrewaris_maart_april_maaie_juny_july_augustus_septimber_oktober_novimber_desimber'.split(
            '_'
        ),
        monthsShort: function (m, format) {
            if (!m) {
                return monthsShortWithDots;
            } else if (/-MMM-/.test(format)) {
                return monthsShortWithoutDots[m.month()];
            } else {
                return monthsShortWithDots[m.month()];
            }
        },
        monthsParseExact: true,
        weekdays: 'snein_moandei_tiisdei_woansdei_tongersdei_freed_sneon'.split(
            '_'
        ),
        weekdaysShort: 'si._mo._ti._wo._to._fr._so.'.split('_'),
        weekdaysMin: 'Si_Mo_Ti_Wo_To_Fr_So'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD-MM-YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[hjoed om] LT',
            nextDay: '[moarn om] LT',
            nextWeek: 'dddd [om] LT',
            lastDay: '[juster om] LT',
            lastWeek: '[척fr청ne] dddd [om] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'oer %s',
            past: '%s lyn',
            s: 'in pear sekonden',
            ss: '%d sekonden',
            m: 'ien min첬t',
            mm: '%d minuten',
            h: 'ien oere',
            hh: '%d oeren',
            d: 'ien dei',
            dd: '%d dagen',
            M: 'ien moanne',
            MM: '%d moannen',
            y: 'ien jier',
            yy: '%d jierren',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(ste|de)/,
        ordinal: function (number) {
            return (
                number +
                (number === 1 || number === 8 || number >= 20 ? 'ste' : 'de')
            );
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var months$6 = [
            'Ean찼ir',
            'Feabhra',
            'M찼rta',
            'Aibre찼n',
            'Bealtaine',
            'Meitheamh',
            'I첬il',
            'L첬nasa',
            'Me찼n F처mhair',
            'Deireadh F처mhair',
            'Samhain',
            'Nollaig',
        ],
        monthsShort$5 = [
            'Ean',
            'Feabh',
            'M찼rt',
            'Aib',
            'Beal',
            'Meith',
            'I첬il',
            'L첬n',
            'M.F.',
            'D.F.',
            'Samh',
            'Noll',
        ],
        weekdays$1 = [
            'D챕 Domhnaigh',
            'D챕 Luain',
            'D챕 M찼irt',
            'D챕 C챕adaoin',
            'D챕ardaoin',
            'D챕 hAoine',
            'D챕 Sathairn',
        ],
        weekdaysShort = ['Domh', 'Luan', 'M찼irt', 'C챕ad', 'D챕ar', 'Aoine', 'Sath'],
        weekdaysMin = ['Do', 'Lu', 'M찼', 'C챕', 'D챕', 'A', 'Sa'];

    hooks.defineLocale('ga', {
        months: months$6,
        monthsShort: monthsShort$5,
        monthsParseExact: true,
        weekdays: weekdays$1,
        weekdaysShort: weekdaysShort,
        weekdaysMin: weekdaysMin,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Inniu ag] LT',
            nextDay: '[Am찼rach ag] LT',
            nextWeek: 'dddd [ag] LT',
            lastDay: '[Inn챕 ag] LT',
            lastWeek: 'dddd [seo caite] [ag] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'i %s',
            past: '%s 처 shin',
            s: 'c첬pla soicind',
            ss: '%d soicind',
            m: 'n처im챕ad',
            mm: '%d n처im챕ad',
            h: 'uair an chloig',
            hh: '%d uair an chloig',
            d: 'l찼',
            dd: '%d l찼',
            M: 'm챠',
            MM: '%d m챠onna',
            y: 'bliain',
            yy: '%d bliain',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(d|na|mh)/,
        ordinal: function (number) {
            var output = number === 1 ? 'd' : number % 10 === 2 ? 'na' : 'mh';
            return number + output;
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var months$7 = [
            'Am Faoilleach',
            'An Gearran',
            'Am M횪rt',
            'An Giblean',
            'An C챔itean',
            'An t-횘gmhios',
            'An t-Iuchar',
            'An L첫nastal',
            'An t-Sultain',
            'An D횪mhair',
            'An t-Samhain',
            'An D첫bhlachd',
        ],
        monthsShort$6 = [
            'Faoi',
            'Gear',
            'M횪rt',
            'Gibl',
            'C챔it',
            '횘gmh',
            'Iuch',
            'L첫n',
            'Sult',
            'D횪mh',
            'Samh',
            'D첫bh',
        ],
        weekdays$2 = [
            'Did챵mhnaich',
            'Diluain',
            'Dim횪irt',
            'Diciadain',
            'Diardaoin',
            'Dihaoine',
            'Disathairne',
        ],
        weekdaysShort$1 = ['Did', 'Dil', 'Dim', 'Dic', 'Dia', 'Dih', 'Dis'],
        weekdaysMin$1 = ['D챵', 'Lu', 'M횪', 'Ci', 'Ar', 'Ha', 'Sa'];

    hooks.defineLocale('gd', {
        months: months$7,
        monthsShort: monthsShort$6,
        monthsParseExact: true,
        weekdays: weekdays$2,
        weekdaysShort: weekdaysShort$1,
        weekdaysMin: weekdaysMin$1,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[An-diugh aig] LT',
            nextDay: '[A-m횪ireach aig] LT',
            nextWeek: 'dddd [aig] LT',
            lastDay: '[An-d챔 aig] LT',
            lastWeek: 'dddd [seo chaidh] [aig] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'ann an %s',
            past: 'bho chionn %s',
            s: 'beagan diogan',
            ss: '%d diogan',
            m: 'mionaid',
            mm: '%d mionaidean',
            h: 'uair',
            hh: '%d uairean',
            d: 'latha',
            dd: '%d latha',
            M: 'm챙os',
            MM: '%d m챙osan',
            y: 'bliadhna',
            yy: '%d bliadhna',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(d|na|mh)/,
        ordinal: function (number) {
            var output = number === 1 ? 'd' : number % 10 === 2 ? 'na' : 'mh';
            return number + output;
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('gl', {
        months: 'xaneiro_febreiro_marzo_abril_maio_xu챰o_xullo_agosto_setembro_outubro_novembro_decembro'.split(
            '_'
        ),
        monthsShort: 'xan._feb._mar._abr._mai._xu챰._xul._ago._set._out._nov._dec.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'domingo_luns_martes_m챕rcores_xoves_venres_s찼bado'.split('_'),
        weekdaysShort: 'dom._lun._mar._m챕r._xov._ven._s찼b.'.split('_'),
        weekdaysMin: 'do_lu_ma_m챕_xo_ve_s찼'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D [de] MMMM [de] YYYY',
            LLL: 'D [de] MMMM [de] YYYY H:mm',
            LLLL: 'dddd, D [de] MMMM [de] YYYY H:mm',
        },
        calendar: {
            sameDay: function () {
                return '[hoxe ' + (this.hours() !== 1 ? '찼s' : '찼') + '] LT';
            },
            nextDay: function () {
                return '[ma챰찼 ' + (this.hours() !== 1 ? '찼s' : '찼') + '] LT';
            },
            nextWeek: function () {
                return 'dddd [' + (this.hours() !== 1 ? '찼s' : 'a') + '] LT';
            },
            lastDay: function () {
                return '[onte ' + (this.hours() !== 1 ? '찼' : 'a') + '] LT';
            },
            lastWeek: function () {
                return (
                    '[o] dddd [pasado ' + (this.hours() !== 1 ? '찼s' : 'a') + '] LT'
                );
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: function (str) {
                if (str.indexOf('un') === 0) {
                    return 'n' + str;
                }
                return 'en ' + str;
            },
            past: 'hai %s',
            s: 'uns segundos',
            ss: '%d segundos',
            m: 'un minuto',
            mm: '%d minutos',
            h: 'unha hora',
            hh: '%d horas',
            d: 'un d챠a',
            dd: '%d d챠as',
            M: 'un mes',
            MM: '%d meses',
            y: 'un ano',
            yy: '%d anos',
        },
        dayOfMonthOrdinalParse: /\d{1,2}쨘/,
        ordinal: '%d쨘',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    function processRelativeTime$4(number, withoutSuffix, key, isFuture) {
        var format = {
            s: ['西�쪑西□ㄿ西� 西멘쪋西뺖쨧西□ㅎ西귖ㄸ誓�', '西�쪑西□쪍 西멘쪋西뺖쨧西�'],
            ss: [number + ' 西멘쪋西뺖쨧西□ㅎ西귖ㄸ誓�', number + ' 西멘쪋西뺖쨧西�'],
            m: ['西뤲쨻西� 西�ㅏ西｀쩅西약ㄸ', '西뤲쨻 西�ㅏ西ⓣ쪈西�'],
            mm: [number + ' 西�ㅏ西｀쩅西약쨧西ⓣ�', number + ' 西�ㅏ西｀쩅西약쨧'],
            h: ['西뤲쨻西� 西듀ㅀ西약ㄸ', '西뤲쨻 西듀ㅀ'],
            hh: [number + ' 西듀ㅀ西약쨧西ⓣ�', number + ' 西듀ㅀ西약쨧'],
            d: ['西뤲쨻西� 西╆ㅏ西멘ㅎ西�', '西뤲쨻 西╆�西�'],
            dd: [number + ' 西╆ㅏ西멘ㅎ西귖ㄸ誓�', number + ' 西╆�西�'],
            M: ['西뤲쨻西� 西�쪓西밝ㄿ西ⓣ쪓西�ㅎ西�', '西뤲쨻 西�쪓西밝ㄿ西ⓣ쪑'],
            MM: [number + ' 西�쪓西밝ㄿ西ⓣ쪓西�ㅎ西ⓣ�', number + ' 西�쪓西밝ㄿ西ⓣ쪍'],
            y: ['西뤲쨻西� 西듀ㅀ誓띭ㅈ西약ㄸ', '西뤲쨻 西듀ㅀ誓띭ㅈ'],
            yy: [number + ' 西듀ㅀ誓띭ㅈ西약쨧西ⓣ�', number + ' 西듀ㅀ誓띭ㅈ西약쨧'],
        };
        return isFuture ? format[key][0] : format[key][1];
    }

    hooks.defineLocale('gom-deva', {
        months: {
            standalone: '西쒉ㅎ西ⓣ쪍西듀ㅎ西겯�_西ム쪍西о쪓西겯쪇西듀ㅎ西겯�_西�ㅎ西겯쪓西�_西뤲ㄺ誓띭ㅀ誓�西�_西�쪍_西쒉쪈西�_西쒉쪇西꿋ㄿ_西묂쨽西멘쪓西�_西멘ㄺ誓띭쩅誓뉋쨧西оㅀ_西묂쨻誓띭쩅誓뗠ㄼ西�_西ⓣ쪑西듀쪓西밝쪍西귖ㄼ西�_西□ㅏ西멘쪍西귖ㄼ西�'.split(
                '_'
            ),
            format: '西쒉ㅎ西ⓣ쪍西듀ㅎ西겯�西싟쪓西�ㅎ_西ム쪍西о쪓西겯쪇西듀ㅎ西겯�西싟쪓西�ㅎ_西�ㅎ西겯쪓西싟ㅎ西싟쪓西�ㅎ_西뤲ㄺ誓띭ㅀ誓�西꿋ㅎ西싟쪓西�ㅎ_西�쪍西�ㅎ西싟쪓西�ㅎ_西쒉쪈西ⓣㅎ西싟쪓西�ㅎ_西쒉쪇西꿋ㄿ西약쩀誓띭ㄿ西�_西묂쨽西멘쪓西잀ㅎ西싟쪓西�ㅎ_西멘ㄺ誓띭쩅誓뉋쨧西оㅀ西약쩀誓띭ㄿ西�_西묂쨻誓띭쩅誓뗠ㄼ西겯ㅎ西싟쪓西�ㅎ_西ⓣ쪑西듀쪓西밝쪍西귖ㄼ西겯ㅎ西싟쪓西�ㅎ_西□ㅏ西멘쪍西귖ㄼ西겯ㅎ西싟쪓西�ㅎ'.split(
                '_'
            ),
            isFormat: /MMMM(\s)+D[oD]?/,
        },
        monthsShort: '西쒉ㅎ西ⓣ쪍._西ム쪍西о쪓西겯쪇._西�ㅎ西겯쪓西�_西뤲ㄺ誓띭ㅀ誓�._西�쪍_西쒉쪈西�_西쒉쪇西�._西묂쨽._西멘ㄺ誓띭쩅誓뉋쨧._西묂쨻誓띭쩅誓�._西ⓣ쪑西듀쪓西밝쪍西�._西□ㅏ西멘쪍西�.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: '西녱ㄿ西ㅰㅎ西�_西멘쪑西�ㅎ西�_西�쨧西쀠ㅃ西약ㅀ_西о쪇西㏅ㅅ西약ㅀ_西оㅏ西겯쪍西멘쪓西ㅰㅎ西�_西멘쪇西뺖쪓西겯ㅎ西�_西뜩쪍西ⓣㅅ西약ㅀ'.split('_'),
        weekdaysShort: '西녱ㄿ西�._西멘쪑西�._西�쨧西쀠ㅃ._西о쪇西�._西о쪓西겯쪍西멘쪓西�._西멘쪇西뺖쪓西�._西뜩쪍西�.'.split('_'),
        weekdaysMin: '西�_西멘쪑_西�쨧_西о쪇_西о쪓西겯쪍_西멘쪇_西뜩쪍'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'A h:mm [西듀ㅎ西쒉ㄴ西약쨧]',
            LTS: 'A h:mm:ss [西듀ㅎ西쒉ㄴ西약쨧]',
            L: 'DD-MM-YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY A h:mm [西듀ㅎ西쒉ㄴ西약쨧]',
            LLLL: 'dddd, MMMM Do, YYYY, A h:mm [西듀ㅎ西쒉ㄴ西약쨧]',
            llll: 'ddd, D MMM YYYY, A h:mm [西듀ㅎ西쒉ㄴ西약쨧]',
        },
        calendar: {
            sameDay: '[西녱ㄿ西�] LT',
            nextDay: '[西ムㅎ西꿋쪓西�ㅎ西�] LT',
            nextWeek: '[西ム쪇西□ㅂ誓�] dddd[,] LT',
            lastDay: '[西뺖ㅎ西�] LT',
            lastWeek: '[西ムㅎ西잀ㅂ誓�] dddd[,] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s',
            past: '%s 西녱ㄶ誓�西�',
            s: processRelativeTime$4,
            ss: processRelativeTime$4,
            m: processRelativeTime$4,
            mm: processRelativeTime$4,
            h: processRelativeTime$4,
            hh: processRelativeTime$4,
            d: processRelativeTime$4,
            dd: processRelativeTime$4,
            M: processRelativeTime$4,
            MM: processRelativeTime$4,
            y: processRelativeTime$4,
            yy: processRelativeTime$4,
        },
        dayOfMonthOrdinalParse: /\d{1,2}(西듀쪍西�)/,
        ordinal: function (number, period) {
            switch (period) {
                // the ordinal '西듀쪍西�' only applies to day of the month
                case 'D':
                    return number + '西듀쪍西�';
                default:
                case 'M':
                case 'Q':
                case 'DDD':
                case 'd':
                case 'w':
                case 'W':
                    return number;
            }
        },
        week: {
            dow: 0, // Sunday is the first day of the week
            doy: 3, // The week that contains Jan 4th is the first week of the year (7 + 0 - 4)
        },
        meridiemParse: /西겯ㅎ西ㅰ�|西멘쨻西약ㅃ誓�西�|西╆ㄸ西むㅎ西겯ㅎ西�|西멘ㅎ西귖쩂誓�/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '西겯ㅎ西ㅰ�') {
                return hour < 4 ? hour : hour + 12;
            } else if (meridiem === '西멘쨻西약ㅃ誓�西�') {
                return hour;
            } else if (meridiem === '西╆ㄸ西むㅎ西겯ㅎ西�') {
                return hour > 12 ? hour : hour + 12;
            } else if (meridiem === '西멘ㅎ西귖쩂誓�') {
                return hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 4) {
                return '西겯ㅎ西ㅰ�';
            } else if (hour < 12) {
                return '西멘쨻西약ㅃ誓�西�';
            } else if (hour < 16) {
                return '西╆ㄸ西むㅎ西겯ㅎ西�';
            } else if (hour < 20) {
                return '西멘ㅎ西귖쩂誓�';
            } else {
                return '西겯ㅎ西ㅰ�';
            }
        },
    });

    //! moment.js locale configuration

    function processRelativeTime$5(number, withoutSuffix, key, isFuture) {
        var format = {
            s: ['thoddea sekondamni', 'thodde sekond'],
            ss: [number + ' sekondamni', number + ' sekond'],
            m: ['eka mintan', 'ek minut'],
            mm: [number + ' mintamni', number + ' mintam'],
            h: ['eka voran', 'ek vor'],
            hh: [number + ' voramni', number + ' voram'],
            d: ['eka disan', 'ek dis'],
            dd: [number + ' disamni', number + ' dis'],
            M: ['eka mhoinean', 'ek mhoino'],
            MM: [number + ' mhoineamni', number + ' mhoine'],
            y: ['eka vorsan', 'ek voros'],
            yy: [number + ' vorsamni', number + ' vorsam'],
        };
        return isFuture ? format[key][0] : format[key][1];
    }

    hooks.defineLocale('gom-latn', {
        months: {
            standalone: 'Janer_Febrer_Mars_Abril_Mai_Jun_Julai_Agost_Setembr_Otubr_Novembr_Dezembr'.split(
                '_'
            ),
            format: 'Janerachea_Febrerachea_Marsachea_Abrilachea_Maiachea_Junachea_Julaiachea_Agostachea_Setembrachea_Otubrachea_Novembrachea_Dezembrachea'.split(
                '_'
            ),
            isFormat: /MMMM(\s)+D[oD]?/,
        },
        monthsShort: 'Jan._Feb._Mars_Abr._Mai_Jun_Jul._Ago._Set._Otu._Nov._Dez.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: "Aitar_Somar_Mongllar_Budhvar_Birestar_Sukrar_Son'var".split('_'),
        weekdaysShort: 'Ait._Som._Mon._Bud._Bre._Suk._Son.'.split('_'),
        weekdaysMin: 'Ai_Sm_Mo_Bu_Br_Su_Sn'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'A h:mm [vazta]',
            LTS: 'A h:mm:ss [vazta]',
            L: 'DD-MM-YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY A h:mm [vazta]',
            LLLL: 'dddd, MMMM Do, YYYY, A h:mm [vazta]',
            llll: 'ddd, D MMM YYYY, A h:mm [vazta]',
        },
        calendar: {
            sameDay: '[Aiz] LT',
            nextDay: '[Faleam] LT',
            nextWeek: '[Fuddlo] dddd[,] LT',
            lastDay: '[Kal] LT',
            lastWeek: '[Fattlo] dddd[,] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s',
            past: '%s adim',
            s: processRelativeTime$5,
            ss: processRelativeTime$5,
            m: processRelativeTime$5,
            mm: processRelativeTime$5,
            h: processRelativeTime$5,
            hh: processRelativeTime$5,
            d: processRelativeTime$5,
            dd: processRelativeTime$5,
            M: processRelativeTime$5,
            MM: processRelativeTime$5,
            y: processRelativeTime$5,
            yy: processRelativeTime$5,
        },
        dayOfMonthOrdinalParse: /\d{1,2}(er)/,
        ordinal: function (number, period) {
            switch (period) {
                // the ordinal 'er' only applies to day of the month
                case 'D':
                    return number + 'er';
                default:
                case 'M':
                case 'Q':
                case 'DDD':
                case 'd':
                case 'w':
                case 'W':
                    return number;
            }
        },
        week: {
            dow: 0, // Sunday is the first day of the week
            doy: 3, // The week that contains Jan 4th is the first week of the year (7 + 0 - 4)
        },
        meridiemParse: /rati|sokallim|donparam|sanje/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'rati') {
                return hour < 4 ? hour : hour + 12;
            } else if (meridiem === 'sokallim') {
                return hour;
            } else if (meridiem === 'donparam') {
                return hour > 12 ? hour : hour + 12;
            } else if (meridiem === 'sanje') {
                return hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 4) {
                return 'rati';
            } else if (hour < 12) {
                return 'sokallim';
            } else if (hour < 16) {
                return 'donparam';
            } else if (hour < 20) {
                return 'sanje';
            } else {
                return 'rati';
            }
        },
    });

    //! moment.js locale configuration

    var symbolMap$7 = {
            1: '奭�',
            2: '奭�',
            3: '奭�',
            4: '奭�',
            5: '奭�',
            6: '奭�',
            7: '奭�',
            8: '奭�',
            9: '奭�',
            0: '奭�',
        },
        numberMap$6 = {
            '奭�': '1',
            '奭�': '2',
            '奭�': '3',
            '奭�': '4',
            '奭�': '5',
            '奭�': '6',
            '奭�': '7',
            '奭�': '8',
            '奭�': '9',
            '奭�': '0',
        };

    hooks.defineLocale('gu', {
        months: '夕쒉ぞ夕ⓣ쳨夕�쳛夕녱ぐ奭�_夕ム쳡夕о쳨夕겯쳛夕녱ぐ奭�_夕�ぞ夕겯쳨夕�_夕뤲お奭띭ぐ夕욈げ_夕�쳡_夕쒉쳜夕�_夕쒉쳛夕꿋ぞ夕�_夕묂첊夕멘쳨夕�_夕멘お奭띭첒奭뉋ぎ奭띭が夕�_夕묂첈奭띭첒奭띭が夕�_夕ⓣさ奭뉋ぎ奭띭が夕�_夕□た夕멘쳡夕�쳨夕оぐ'.split(
            '_'
        ),
        monthsShort: '夕쒉ぞ夕ⓣ쳨夕�쳛._夕ム쳡夕о쳨夕겯쳛._夕�ぞ夕겯쳨夕�_夕뤲お奭띭ぐ夕�._夕�쳡_夕쒉쳜夕�_夕쒉쳛夕꿋ぞ._夕묂첊._夕멘お奭띭첒奭�._夕묂첈奭띭첒奭�._夕ⓣさ奭�._夕□た夕멘쳡.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: '夕겯さ夕욈さ夕약ぐ_夕멘쳦夕�さ夕약ぐ_夕�챴夕쀠こ夕듀ぞ夕�_夕о쳛夕㏅쳨夕듀ぞ夕�_夕쀠쳛夕겯쳛夕듀ぞ夕�_夕뜩쳛夕뺖쳨夕겯さ夕약ぐ_夕뜩え夕욈さ夕약ぐ'.split(
            '_'
        ),
        weekdaysShort: '夕겯さ夕�_夕멘쳦夕�_夕�챴夕쀠こ_夕о쳛夕㏅쳨_夕쀠쳛夕겯쳛_夕뜩쳛夕뺖쳨夕�_夕뜩え夕�'.split('_'),
        weekdaysMin: '夕�_夕멘쳦_夕�챴_夕о쳛_夕쀠쳛_夕뜩쳛_夕�'.split('_'),
        longDateFormat: {
            LT: 'A h:mm 夕듀ぞ夕쀠쳨夕�쳡',
            LTS: 'A h:mm:ss 夕듀ぞ夕쀠쳨夕�쳡',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY, A h:mm 夕듀ぞ夕쀠쳨夕�쳡',
            LLLL: 'dddd, D MMMM YYYY, A h:mm 夕듀ぞ夕쀠쳨夕�쳡',
        },
        calendar: {
            sameDay: '[夕녱첏] LT',
            nextDay: '[夕뺖ぞ夕꿋쳡] LT',
            nextWeek: 'dddd, LT',
            lastDay: '[夕쀠챺夕뺖ぞ夕꿋쳡] LT',
            lastWeek: '[夕むぞ夕쎹げ夕�] dddd, LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s 夕�ぞ',
            past: '%s 夕むす奭뉋げ夕�',
            s: '夕끶ぎ奭곟첈 夕むこ奭�',
            ss: '%d 夕멘쳡夕뺖챴夕�',
            m: '夕뤲첈 夕�た夕ⓣた夕�',
            mm: '%d 夕�た夕ⓣた夕�',
            h: '夕뤲첈 夕뺖げ夕약첈',
            hh: '%d 夕뺖げ夕약첈',
            d: '夕뤲첈 夕╆た夕듀じ',
            dd: '%d 夕╆た夕듀じ',
            M: '夕뤲첈 夕�す夕욈え奭�',
            MM: '%d 夕�す夕욈え奭�',
            y: '夕뤲첈 夕듀ぐ奭띭し',
            yy: '%d 夕듀ぐ奭띭し',
        },
        preparse: function (string) {
            return string.replace(/[奭㏅エ奭⒯オ奭ムガ奭�ギ奭�ウ]/g, function (match) {
                return numberMap$6[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap$7[match];
            });
        },
        // Gujarati notation for meridiems are quite fuzzy in practice. While there exists
        // a rigid notion of a 'Pahar' it is not used as rigidly in modern Gujarati.
        meridiemParse: /夕겯ぞ夕�|夕оお奭뗠ぐ|夕멘さ夕약ぐ|夕멘ぞ夕귖첏/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '夕겯ぞ夕�') {
                return hour < 4 ? hour : hour + 12;
            } else if (meridiem === '夕멘さ夕약ぐ') {
                return hour;
            } else if (meridiem === '夕оお奭뗠ぐ') {
                return hour >= 10 ? hour : hour + 12;
            } else if (meridiem === '夕멘ぞ夕귖첏') {
                return hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 4) {
                return '夕겯ぞ夕�';
            } else if (hour < 10) {
                return '夕멘さ夕약ぐ';
            } else if (hour < 17) {
                return '夕оお奭뗠ぐ';
            } else if (hour < 20) {
                return '夕멘ぞ夕귖첏';
            } else {
                return '夕겯ぞ夕�';
            }
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 6, // The week that contains Jan 6th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('he', {
        months: '����淚_壘�淚��淚_�淚婁_�壘淚��_���_����_����_����遼�_遼壘���淚_��樓���淚_�����淚_�屢��淚'.split(
            '_'
        ),
        monthsShort: '���柳_壘�淚柳_�淚婁_�壘淚柳_���_����_����_���柳_遼壘�柳_��樓柳_���柳_�屢�柳'.split(
            '_'
        ),
        weekdays: '淚�漏��_漏��_漏��漏�_淚��鬧�_���漏�_漏�漏�_漏�瘻'.split('_'),
        weekdaysShort: '�柳_�柳_�柳_�柳_�柳_�柳_漏柳'.split('_'),
        weekdaysMin: '�_�_�_�_�_�_漏'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D [�]MMMM YYYY',
            LLL: 'D [�]MMMM YYYY HH:mm',
            LLLL: 'dddd, D [�]MMMM YYYY HH:mm',
            l: 'D/M/YYYY',
            ll: 'D MMM YYYY',
            lll: 'D MMM YYYY HH:mm',
            llll: 'ddd, D MMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[���� �羚]LT',
            nextDay: '[��淚 �羚]LT',
            nextWeek: 'dddd [�漏鬧�] LT',
            lastDay: '[�瘻��� �羚]LT',
            lastWeek: '[����] dddd [���淚�� �漏鬧�] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '�鬧�� %s',
            past: '�壘�� %s',
            s: '�遼壘淚 漏���瘻',
            ss: '%d 漏���瘻',
            m: '�樓�',
            mm: '%d �樓�瘻',
            h: '漏鬧�',
            hh: function (number) {
                if (number === 2) {
                    return '漏鬧瘻���';
                }
                return number + ' 漏鬧�瘻';
            },
            d: '���',
            dd: function (number) {
                if (number === 2) {
                    return '������';
                }
                return number + ' ����';
            },
            M: '���漏',
            MM: function (number) {
                if (number === 2) {
                    return '���漏���';
                }
                return number + ' ���漏��';
            },
            y: '漏��',
            yy: function (number) {
                if (number === 2) {
                    return '漏�瘻���';
                } else if (number % 10 === 0 && number !== 10) {
                    return number + ' 漏��';
                }
                return number + ' 漏���';
            },
        },
        meridiemParse: /���"屢|�壘��"屢|��淚� �屢�淚���|�壘�� �屢�淚���|�壘��瘻 ��樓淚|���樓淚|�鬧淚�/i,
        isPM: function (input) {
            return /^(���"屢|��淚� �屢�淚���|�鬧淚�)$/.test(input);
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 5) {
                return '�壘��瘻 ��樓淚';
            } else if (hour < 10) {
                return '���樓淚';
            } else if (hour < 12) {
                return isLower ? '�壘��"屢' : '�壘�� �屢�淚���';
            } else if (hour < 18) {
                return isLower ? '���"屢' : '��淚� �屢�淚���';
            } else {
                return '�鬧淚�';
            }
        },
    });

    //! moment.js locale configuration

    var symbolMap$8 = {
            1: '誓�',
            2: '誓�',
            3: '誓�',
            4: '誓�',
            5: '誓�',
            6: '誓�',
            7: '誓�',
            8: '誓�',
            9: '誓�',
            0: '誓�',
        },
        numberMap$7 = {
            '誓�': '1',
            '誓�': '2',
            '誓�': '3',
            '誓�': '4',
            '誓�': '5',
            '誓�': '6',
            '誓�': '7',
            '誓�': '8',
            '誓�': '9',
            '誓�': '0',
        },
        monthsParse$7 = [
            /^西쒉ㄸ/i,
            /^西ムㅌ西�|西ムㅀ/i,
            /^西�ㅎ西겯쪓西�/i,
            /^西끶ㄺ誓띭ㅀ誓�/i,
            /^西�쨮/i,
            /^西쒉쪈西�/i,
            /^西쒉쪇西�/i,
            /^西끶쨽/i,
            /^西멘ㅏ西ㅰ쨧|西멘ㅏ西�/i,
            /^西끶쨻誓띭쩅誓�/i,
            /^西ⓣㅅ|西ⓣㅅ西�/i,
            /^西╆ㅏ西멘쨧|西╆ㅏ西�/i,
        ],
        shortMonthsParse = [
            /^西쒉ㄸ/i,
            /^西ムㅌ西�/i,
            /^西�ㅎ西겯쪓西�/i,
            /^西끶ㄺ誓띭ㅀ誓�/i,
            /^西�쨮/i,
            /^西쒉쪈西�/i,
            /^西쒉쪇西�/i,
            /^西끶쨽/i,
            /^西멘ㅏ西�/i,
            /^西끶쨻誓띭쩅誓�/i,
            /^西ⓣㅅ/i,
            /^西╆ㅏ西�/i,
        ];

    hooks.defineLocale('hi', {
        months: {
            format: '西쒉ㄸ西듀ㅀ誓�_西ムㅌ西겯ㅅ西겯�_西�ㅎ西겯쪓西�_西끶ㄺ誓띭ㅀ誓댽ㅂ_西�쨮_西쒉쪈西�_西쒉쪇西꿋ㅎ西�_西끶쨽西멘쪓西�_西멘ㅏ西ㅰㄾ誓띭ㄼ西�_西끶쨻誓띭쩅誓귖ㄼ西�_西ⓣㅅ西�쪓西оㅀ_西╆ㅏ西멘ㄾ誓띭ㄼ西�'.split(
                '_'
            ),
            standalone: '西쒉ㄸ西듀ㅀ誓�_西ムㅀ西듀ㅀ誓�_西�ㅎ西겯쪓西�_西끶ㄺ誓띭ㅀ誓댽ㅂ_西�쨮_西쒉쪈西�_西쒉쪇西꿋ㅎ西�_西끶쨽西멘쪓西�_西멘ㅏ西ㅰ쨧西оㅀ_西끶쨻誓띭쩅誓귖ㄼ西�_西ⓣㅅ西귖ㄼ西�_西╆ㅏ西멘쨧西оㅀ'.split(
                '_'
            ),
        },
        monthsShort: '西쒉ㄸ._西ムㅌ西�._西�ㅎ西겯쪓西�_西끶ㄺ誓띭ㅀ誓�._西�쨮_西쒉쪈西�_西쒉쪇西�._西끶쨽._西멘ㅏ西�._西끶쨻誓띭쩅誓�._西ⓣㅅ._西╆ㅏ西�.'.split(
            '_'
        ),
        weekdays: '西겯ㅅ西욈ㅅ西약ㅀ_西멘쪑西�ㅅ西약ㅀ_西�쨧西쀠ㅂ西듀ㅎ西�_西о쪇西㏅ㅅ西약ㅀ_西쀠쪇西겯쪈西듀ㅎ西�_西뜩쪇西뺖쪓西겯ㅅ西약ㅀ_西뜩ㄸ西욈ㅅ西약ㅀ'.split('_'),
        weekdaysShort: '西겯ㅅ西�_西멘쪑西�_西�쨧西쀠ㅂ_西о쪇西�_西쀠쪇西겯쪈_西뜩쪇西뺖쪓西�_西뜩ㄸ西�'.split('_'),
        weekdaysMin: '西�_西멘쪑_西�쨧_西о쪇_西쀠쪇_西뜩쪇_西�'.split('_'),
        longDateFormat: {
            LT: 'A h:mm 西о쩂誓�',
            LTS: 'A h:mm:ss 西о쩂誓�',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY, A h:mm 西о쩂誓�',
            LLLL: 'dddd, D MMMM YYYY, A h:mm 西о쩂誓�',
        },

        monthsParse: monthsParse$7,
        longMonthsParse: monthsParse$7,
        shortMonthsParse: shortMonthsParse,

        monthsRegex: /^(西쒉ㄸ西듀ㅀ誓�|西쒉ㄸ\.?|西ムㅌ西겯ㅅ西겯�|西ムㅀ西듀ㅀ誓�|西ムㅌ西�\.?|西�ㅎ西겯쪓西�?|西끶ㄺ誓띭ㅀ誓댽ㅂ|西끶ㄺ誓띭ㅀ誓�\.?|西�쨮?|西쒉쪈西�?|西쒉쪇西꿋ㅎ西�|西쒉쪇西�\.?|西끶쨽西멘쪓西�|西끶쨽\.?|西멘ㅏ西ㅰㄾ誓띭ㄼ西�|西멘ㅏ西ㅰ쨧西оㅀ|西멘ㅏ西�\.?|西끶쨻誓띭쩅誓귖ㄼ西�|西끶쨻誓띭쩅誓�\.?|西ⓣㅅ西�쪓西оㅀ|西ⓣㅅ西귖ㄼ西�|西ⓣㅅ\.?|西╆ㅏ西멘ㄾ誓띭ㄼ西�|西╆ㅏ西멘쨧西оㅀ|西╆ㅏ西�\.?)/i,

        monthsShortRegex: /^(西쒉ㄸ西듀ㅀ誓�|西쒉ㄸ\.?|西ムㅌ西겯ㅅ西겯�|西ムㅀ西듀ㅀ誓�|西ムㅌ西�\.?|西�ㅎ西겯쪓西�?|西끶ㄺ誓띭ㅀ誓댽ㅂ|西끶ㄺ誓띭ㅀ誓�\.?|西�쨮?|西쒉쪈西�?|西쒉쪇西꿋ㅎ西�|西쒉쪇西�\.?|西끶쨽西멘쪓西�|西끶쨽\.?|西멘ㅏ西ㅰㄾ誓띭ㄼ西�|西멘ㅏ西ㅰ쨧西оㅀ|西멘ㅏ西�\.?|西끶쨻誓띭쩅誓귖ㄼ西�|西끶쨻誓띭쩅誓�\.?|西ⓣㅅ西�쪓西оㅀ|西ⓣㅅ西귖ㄼ西�|西ⓣㅅ\.?|西╆ㅏ西멘ㄾ誓띭ㄼ西�|西╆ㅏ西멘쨧西оㅀ|西╆ㅏ西�\.?)/i,

        monthsStrictRegex: /^(西쒉ㄸ西듀ㅀ誓�?|西ムㅌ西겯ㅅ西겯�|西ムㅀ西듀ㅀ誓�?|西�ㅎ西겯쪓西�?|西끶ㄺ誓띭ㅀ誓댽ㅂ?|西�쨮?|西쒉쪈西�?|西쒉쪇西꿋ㅎ西�?|西끶쨽西멘쪓西�?|西멘ㅏ西ㅰㄾ誓띭ㄼ西�|西멘ㅏ西ㅰ쨧西оㅀ|西멘ㅏ西�?\.?|西끶쨻誓띭쩅誓귖ㄼ西�|西끶쨻誓띭쩅誓�\.?|西ⓣㅅ西�쪓西оㅀ|西ⓣㅅ西귖ㄼ西�?|西╆ㅏ西멘ㄾ誓띭ㄼ西�|西╆ㅏ西멘쨧西оㅀ?)/i,

        monthsShortStrictRegex: /^(西쒉ㄸ\.?|西ムㅌ西�\.?|西�ㅎ西겯쪓西�?|西끶ㄺ誓띭ㅀ誓�\.?|西�쨮?|西쒉쪈西�?|西쒉쪇西�\.?|西끶쨽\.?|西멘ㅏ西�\.?|西끶쨻誓띭쩅誓�\.?|西ⓣㅅ\.?|西╆ㅏ西�\.?)/i,

        calendar: {
            sameDay: '[西녱쩂] LT',
            nextDay: '[西뺖ㅂ] LT',
            nextWeek: 'dddd, LT',
            lastDay: '[西뺖ㅂ] LT',
            lastWeek: '[西むㅏ西쎹ㅂ誓�] dddd, LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s 西�쪍西�',
            past: '%s 西むㅉ西꿋쪍',
            s: '西뺖쪇西� 西밝� 西뺖쪓西룅ㄳ',
            ss: '%d 西멘쪍西뺖쨧西�',
            m: '西뤲쨻 西�ㅏ西ⓣ쩅',
            mm: '%d 西�ㅏ西ⓣ쩅',
            h: '西뤲쨻 西섁쨧西잀ㅎ',
            hh: '%d 西섁쨧西잀쪍',
            d: '西뤲쨻 西╆ㅏ西�',
            dd: '%d 西╆ㅏ西�',
            M: '西뤲쨻 西�ㅉ誓�西ⓣ쪍',
            MM: '%d 西�ㅉ誓�西ⓣ쪍',
            y: '西뤲쨻 西듀ㅀ誓띭ㅇ',
            yy: '%d 西듀ㅀ誓띭ㅇ',
        },
        preparse: function (string) {
            return string.replace(/[誓㏅ⅷ誓⒯ⅹ誓ム�誓��誓�ⅵ]/g, function (match) {
                return numberMap$7[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap$8[match];
            });
        },
        // Hindi notation for meridiems are quite fuzzy in practice. While there exists
        // a rigid notion of a 'Pahar' it is not used as rigidly in modern Hindi.
        meridiemParse: /西겯ㅎ西�|西멘쪇西оㅉ|西╆쪑西むㅉ西�|西뜩ㅎ西�/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '西겯ㅎ西�') {
                return hour < 4 ? hour : hour + 12;
            } else if (meridiem === '西멘쪇西оㅉ') {
                return hour;
            } else if (meridiem === '西╆쪑西むㅉ西�') {
                return hour >= 10 ? hour : hour + 12;
            } else if (meridiem === '西뜩ㅎ西�') {
                return hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 4) {
                return '西겯ㅎ西�';
            } else if (hour < 10) {
                return '西멘쪇西оㅉ';
            } else if (hour < 17) {
                return '西╆쪑西むㅉ西�';
            } else if (hour < 20) {
                return '西뜩ㅎ西�';
            } else {
                return '西겯ㅎ西�';
            }
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 6, // The week that contains Jan 6th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    function translate$3(number, withoutSuffix, key) {
        var result = number + ' ';
        switch (key) {
            case 'ss':
                if (number === 1) {
                    result += 'sekunda';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'sekunde';
                } else {
                    result += 'sekundi';
                }
                return result;
            case 'm':
                return withoutSuffix ? 'jedna minuta' : 'jedne minute';
            case 'mm':
                if (number === 1) {
                    result += 'minuta';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'minute';
                } else {
                    result += 'minuta';
                }
                return result;
            case 'h':
                return withoutSuffix ? 'jedan sat' : 'jednog sata';
            case 'hh':
                if (number === 1) {
                    result += 'sat';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'sata';
                } else {
                    result += 'sati';
                }
                return result;
            case 'dd':
                if (number === 1) {
                    result += 'dan';
                } else {
                    result += 'dana';
                }
                return result;
            case 'MM':
                if (number === 1) {
                    result += 'mjesec';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'mjeseca';
                } else {
                    result += 'mjeseci';
                }
                return result;
            case 'yy':
                if (number === 1) {
                    result += 'godina';
                } else if (number === 2 || number === 3 || number === 4) {
                    result += 'godine';
                } else {
                    result += 'godina';
                }
                return result;
        }
    }

    hooks.defineLocale('hr', {
        months: {
            format: 'sije훾nja_velja훾e_o탑ujka_travnja_svibnja_lipnja_srpnja_kolovoza_rujna_listopada_studenoga_prosinca'.split(
                '_'
            ),
            standalone: 'sije훾anj_velja훾a_o탑ujak_travanj_svibanj_lipanj_srpanj_kolovoz_rujan_listopad_studeni_prosinac'.split(
                '_'
            ),
        },
        monthsShort: 'sij._velj._o탑u._tra._svi._lip._srp._kol._ruj._lis._stu._pro.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'nedjelja_ponedjeljak_utorak_srijeda_훾etvrtak_petak_subota'.split(
            '_'
        ),
        weekdaysShort: 'ned._pon._uto._sri._훾et._pet._sub.'.split('_'),
        weekdaysMin: 'ne_po_ut_sr_훾e_pe_su'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'Do MMMM YYYY',
            LLL: 'Do MMMM YYYY H:mm',
            LLLL: 'dddd, Do MMMM YYYY H:mm',
        },
        calendar: {
            sameDay: '[danas u] LT',
            nextDay: '[sutra u] LT',
            nextWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[u] [nedjelju] [u] LT';
                    case 3:
                        return '[u] [srijedu] [u] LT';
                    case 6:
                        return '[u] [subotu] [u] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[u] dddd [u] LT';
                }
            },
            lastDay: '[ju훾er u] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[pro큄lu] [nedjelju] [u] LT';
                    case 3:
                        return '[pro큄lu] [srijedu] [u] LT';
                    case 6:
                        return '[pro큄le] [subote] [u] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[pro큄li] dddd [u] LT';
                }
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: 'za %s',
            past: 'prije %s',
            s: 'par sekundi',
            ss: translate$3,
            m: translate$3,
            mm: translate$3,
            h: translate$3,
            hh: translate$3,
            d: 'dan',
            dd: translate$3,
            M: 'mjesec',
            MM: translate$3,
            y: 'godinu',
            yy: translate$3,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var weekEndings = 'vas찼rnap h챕tf흷n kedden szerd찼n cs체t철rt철k철n p챕nteken szombaton'.split(
        ' '
    );
    function translate$4(number, withoutSuffix, key, isFuture) {
        var num = number;
        switch (key) {
            case 's':
                return isFuture || withoutSuffix
                    ? 'n챕h찼ny m찼sodperc'
                    : 'n챕h찼ny m찼sodperce';
            case 'ss':
                return num + (isFuture || withoutSuffix)
                    ? ' m찼sodperc'
                    : ' m찼sodperce';
            case 'm':
                return 'egy' + (isFuture || withoutSuffix ? ' perc' : ' perce');
            case 'mm':
                return num + (isFuture || withoutSuffix ? ' perc' : ' perce');
            case 'h':
                return 'egy' + (isFuture || withoutSuffix ? ' 처ra' : ' 처r찼ja');
            case 'hh':
                return num + (isFuture || withoutSuffix ? ' 처ra' : ' 처r찼ja');
            case 'd':
                return 'egy' + (isFuture || withoutSuffix ? ' nap' : ' napja');
            case 'dd':
                return num + (isFuture || withoutSuffix ? ' nap' : ' napja');
            case 'M':
                return 'egy' + (isFuture || withoutSuffix ? ' h처nap' : ' h처napja');
            case 'MM':
                return num + (isFuture || withoutSuffix ? ' h처nap' : ' h처napja');
            case 'y':
                return 'egy' + (isFuture || withoutSuffix ? ' 챕v' : ' 챕ve');
            case 'yy':
                return num + (isFuture || withoutSuffix ? ' 챕v' : ' 챕ve');
        }
        return '';
    }
    function week(isFuture) {
        return (
            (isFuture ? '' : '[m첬lt] ') +
            '[' +
            weekEndings[this.day()] +
            '] LT[-kor]'
        );
    }

    hooks.defineLocale('hu', {
        months: 'janu찼r_febru찼r_m찼rcius_찼prilis_m찼jus_j첬nius_j첬lius_augusztus_szeptember_okt처ber_november_december'.split(
            '_'
        ),
        monthsShort: 'jan._feb._m찼rc._찼pr._m찼j._j첬n._j첬l._aug._szept._okt._nov._dec.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'vas찼rnap_h챕tf흷_kedd_szerda_cs체t철rt철k_p챕ntek_szombat'.split('_'),
        weekdaysShort: 'vas_h챕t_kedd_sze_cs체t_p챕n_szo'.split('_'),
        weekdaysMin: 'v_h_k_sze_cs_p_szo'.split('_'),
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'YYYY.MM.DD.',
            LL: 'YYYY. MMMM D.',
            LLL: 'YYYY. MMMM D. H:mm',
            LLLL: 'YYYY. MMMM D., dddd H:mm',
        },
        meridiemParse: /de|du/i,
        isPM: function (input) {
            return input.charAt(1).toLowerCase() === 'u';
        },
        meridiem: function (hours, minutes, isLower) {
            if (hours < 12) {
                return isLower === true ? 'de' : 'DE';
            } else {
                return isLower === true ? 'du' : 'DU';
            }
        },
        calendar: {
            sameDay: '[ma] LT[-kor]',
            nextDay: '[holnap] LT[-kor]',
            nextWeek: function () {
                return week.call(this, true);
            },
            lastDay: '[tegnap] LT[-kor]',
            lastWeek: function () {
                return week.call(this, false);
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s m첬lva',
            past: '%s',
            s: translate$4,
            ss: translate$4,
            m: translate$4,
            mm: translate$4,
            h: translate$4,
            hh: translate$4,
            d: translate$4,
            dd: translate$4,
            M: translate$4,
            MM: translate$4,
            y: translate$4,
            yy: translate$4,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('hy-am', {
        months: {
            format: '卵辣�鸞籃蘿�諾_�樂纜�籃蘿�諾_爛蘿�纜諾_蘿擥�諾酪諾_爛蘿蘭諾濫諾_卵辣�鸞諾濫諾_卵辣�酪諾濫諾_�裸辣濫纜辣濫諾_濫樂擥纜樂爛螺樂�諾_卵辣亂纜樂爛螺樂�諾_鸞辣蘭樂爛螺樂�諾_邏樂亂纜樂爛螺樂�諾'.split(
                '_'
            ),
            standalone: '卵辣�鸞籃蘿�_�樂纜�籃蘿�_爛蘿�纜_蘿擥�諾酪_爛蘿蘭諾濫_卵辣�鸞諾濫_卵辣�酪諾濫_�裸辣濫纜辣濫_濫樂擥纜樂爛螺樂�_卵辣亂纜樂爛螺樂�_鸞辣蘭樂爛螺樂�_邏樂亂纜樂爛螺樂�'.split(
                '_'
            ),
        },
        monthsShort: '卵鸞籃_�纜�_爛�纜_蘿擥�_爛蘭濫_卵鸞濫_卵酪濫_�裸濫_濫擥纜_卵亂纜_鸞爛螺_邏亂纜'.split('_'),
        weekdays: '亂諾�蘿亂諾_樂�亂辣�剌蘿螺絡諾_樂�樂�剌蘿螺絡諾_嵐辣�樂�剌蘿螺絡諾_卵諾鸞裸剌蘿螺絡諾_辣��螺蘿絡_剌蘿螺蘿絡'.split(
            '_'
        ),
        weekdaysShort: '亂�亂_樂�亂_樂��_嵐��_卵鸞裸_辣��螺_剌螺絡'.split('_'),
        weekdaysMin: '亂�亂_樂�亂_樂��_嵐��_卵鸞裸_辣��螺_剌螺絡'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D MMMM YYYY 絡.',
            LLL: 'D MMMM YYYY 絡., HH:mm',
            LLLL: 'dddd, D MMMM YYYY 絡., HH:mm',
        },
        calendar: {
            sameDay: '[蘿蘭濫��] LT',
            nextDay: '[籃蘿欒珞] LT',
            lastDay: '[樂�樂亂] LT',
            nextWeek: function () {
                return 'dddd [��珞 落蘿爛珞] LT';
            },
            lastWeek: function () {
                return '[蘿鸞�蘿丹] dddd [��珞 落蘿爛珞] LT';
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s 卵樂纜辣',
            past: '%s 蘿欖蘿攬',
            s: '爛諾 �蘿鸞諾 籃蘿蘭�亂蘭蘿鸞',
            ss: '%d 籃蘿蘭�亂蘭蘿鸞',
            m: '�辣擥樂',
            mm: '%d �辣擥樂',
            h: '落蘿爛',
            hh: '%d 落蘿爛',
            d: '��',
            dd: '%d ��',
            M: '蘿爛諾濫',
            MM: '%d 蘿爛諾濫',
            y: '纜蘿�諾',
            yy: '%d 纜蘿�諾',
        },
        meridiemParse: /裸諾剌樂�籃蘿|蘿欖蘿籃辣纜籃蘿|�樂�樂亂籃蘿|樂�樂亂辣蘭蘿鸞/,
        isPM: function (input) {
            return /^(�樂�樂亂籃蘿|樂�樂亂辣蘭蘿鸞)$/.test(input);
        },
        meridiem: function (hour) {
            if (hour < 4) {
                return '裸諾剌樂�籃蘿';
            } else if (hour < 12) {
                return '蘿欖蘿籃辣纜籃蘿';
            } else if (hour < 17) {
                return '�樂�樂亂籃蘿';
            } else {
                return '樂�樂亂辣蘭蘿鸞';
            }
        },
        dayOfMonthOrdinalParse: /\d{1,2}|\d{1,2}-(諾鸞|�邏)/,
        ordinal: function (number, period) {
            switch (period) {
                case 'DDD':
                case 'w':
                case 'W':
                case 'DDDo':
                    if (number === 1) {
                        return number + '-諾鸞';
                    }
                    return number + '-�邏';
                default:
                    return number;
            }
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('id', {
        months: 'Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_November_Desember'.split(
            '_'
        ),
        monthsShort: 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Agt_Sep_Okt_Nov_Des'.split('_'),
        weekdays: 'Minggu_Senin_Selasa_Rabu_Kamis_Jumat_Sabtu'.split('_'),
        weekdaysShort: 'Min_Sen_Sel_Rab_Kam_Jum_Sab'.split('_'),
        weekdaysMin: 'Mg_Sn_Sl_Rb_Km_Jm_Sb'.split('_'),
        longDateFormat: {
            LT: 'HH.mm',
            LTS: 'HH.mm.ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY [pukul] HH.mm',
            LLLL: 'dddd, D MMMM YYYY [pukul] HH.mm',
        },
        meridiemParse: /pagi|siang|sore|malam/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'pagi') {
                return hour;
            } else if (meridiem === 'siang') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === 'sore' || meridiem === 'malam') {
                return hour + 12;
            }
        },
        meridiem: function (hours, minutes, isLower) {
            if (hours < 11) {
                return 'pagi';
            } else if (hours < 15) {
                return 'siang';
            } else if (hours < 19) {
                return 'sore';
            } else {
                return 'malam';
            }
        },
        calendar: {
            sameDay: '[Hari ini pukul] LT',
            nextDay: '[Besok pukul] LT',
            nextWeek: 'dddd [pukul] LT',
            lastDay: '[Kemarin pukul] LT',
            lastWeek: 'dddd [lalu pukul] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'dalam %s',
            past: '%s yang lalu',
            s: 'beberapa detik',
            ss: '%d detik',
            m: 'semenit',
            mm: '%d menit',
            h: 'sejam',
            hh: '%d jam',
            d: 'sehari',
            dd: '%d hari',
            M: 'sebulan',
            MM: '%d bulan',
            y: 'setahun',
            yy: '%d tahun',
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 6, // The week that contains Jan 6th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    function plural$2(n) {
        if (n % 100 === 11) {
            return true;
        } else if (n % 10 === 1) {
            return false;
        }
        return true;
    }
    function translate$5(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        switch (key) {
            case 's':
                return withoutSuffix || isFuture
                    ? 'nokkrar sek첬ndur'
                    : 'nokkrum sek첬ndum';
            case 'ss':
                if (plural$2(number)) {
                    return (
                        result +
                        (withoutSuffix || isFuture ? 'sek첬ndur' : 'sek첬ndum')
                    );
                }
                return result + 'sek첬nda';
            case 'm':
                return withoutSuffix ? 'm챠n첬ta' : 'm챠n첬tu';
            case 'mm':
                if (plural$2(number)) {
                    return (
                        result + (withoutSuffix || isFuture ? 'm챠n첬tur' : 'm챠n첬tum')
                    );
                } else if (withoutSuffix) {
                    return result + 'm챠n첬ta';
                }
                return result + 'm챠n첬tu';
            case 'hh':
                if (plural$2(number)) {
                    return (
                        result +
                        (withoutSuffix || isFuture
                            ? 'klukkustundir'
                            : 'klukkustundum')
                    );
                }
                return result + 'klukkustund';
            case 'd':
                if (withoutSuffix) {
                    return 'dagur';
                }
                return isFuture ? 'dag' : 'degi';
            case 'dd':
                if (plural$2(number)) {
                    if (withoutSuffix) {
                        return result + 'dagar';
                    }
                    return result + (isFuture ? 'daga' : 'd철gum');
                } else if (withoutSuffix) {
                    return result + 'dagur';
                }
                return result + (isFuture ? 'dag' : 'degi');
            case 'M':
                if (withoutSuffix) {
                    return 'm찼nu챨ur';
                }
                return isFuture ? 'm찼nu챨' : 'm찼nu챨i';
            case 'MM':
                if (plural$2(number)) {
                    if (withoutSuffix) {
                        return result + 'm찼nu챨ir';
                    }
                    return result + (isFuture ? 'm찼nu챨i' : 'm찼nu챨um');
                } else if (withoutSuffix) {
                    return result + 'm찼nu챨ur';
                }
                return result + (isFuture ? 'm찼nu챨' : 'm찼nu챨i');
            case 'y':
                return withoutSuffix || isFuture ? '찼r' : '찼ri';
            case 'yy':
                if (plural$2(number)) {
                    return result + (withoutSuffix || isFuture ? '찼r' : '찼rum');
                }
                return result + (withoutSuffix || isFuture ? '찼r' : '찼ri');
        }
    }

    hooks.defineLocale('is', {
        months: 'jan첬ar_febr첬ar_mars_apr챠l_ma챠_j첬n챠_j첬l챠_찼g첬st_september_okt처ber_n처vember_desember'.split(
            '_'
        ),
        monthsShort: 'jan_feb_mar_apr_ma챠_j첬n_j첬l_찼g첬_sep_okt_n처v_des'.split('_'),
        weekdays: 'sunnudagur_m찼nudagur_첸ri챨judagur_mi챨vikudagur_fimmtudagur_f철studagur_laugardagur'.split(
            '_'
        ),
        weekdaysShort: 'sun_m찼n_첸ri_mi챨_fim_f철s_lau'.split('_'),
        weekdaysMin: 'Su_M찼_횧r_Mi_Fi_F철_La'.split('_'),
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY [kl.] H:mm',
            LLLL: 'dddd, D. MMMM YYYY [kl.] H:mm',
        },
        calendar: {
            sameDay: '[챠 dag kl.] LT',
            nextDay: '[찼 morgun kl.] LT',
            nextWeek: 'dddd [kl.] LT',
            lastDay: '[챠 g챈r kl.] LT',
            lastWeek: '[s챠챨asta] dddd [kl.] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'eftir %s',
            past: 'fyrir %s s챠챨an',
            s: translate$5,
            ss: translate$5,
            m: translate$5,
            mm: translate$5,
            h: 'klukkustund',
            hh: translate$5,
            d: translate$5,
            dd: translate$5,
            M: translate$5,
            MM: translate$5,
            y: translate$5,
            yy: translate$5,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('it-ch', {
        months: 'gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre'.split(
            '_'
        ),
        monthsShort: 'gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic'.split('_'),
        weekdays: 'domenica_luned챙_marted챙_mercoled챙_gioved챙_venerd챙_sabato'.split(
            '_'
        ),
        weekdaysShort: 'dom_lun_mar_mer_gio_ven_sab'.split('_'),
        weekdaysMin: 'do_lu_ma_me_gi_ve_sa'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Oggi alle] LT',
            nextDay: '[Domani alle] LT',
            nextWeek: 'dddd [alle] LT',
            lastDay: '[Ieri alle] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[la scorsa] dddd [alle] LT';
                    default:
                        return '[lo scorso] dddd [alle] LT';
                }
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: function (s) {
                return (/^[0-9].+$/.test(s) ? 'tra' : 'in') + ' ' + s;
            },
            past: '%s fa',
            s: 'alcuni secondi',
            ss: '%d secondi',
            m: 'un minuto',
            mm: '%d minuti',
            h: "un'ora",
            hh: '%d ore',
            d: 'un giorno',
            dd: '%d giorni',
            M: 'un mese',
            MM: '%d mesi',
            y: 'un anno',
            yy: '%d anni',
        },
        dayOfMonthOrdinalParse: /\d{1,2}쨘/,
        ordinal: '%d쨘',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('it', {
        months: 'gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre'.split(
            '_'
        ),
        monthsShort: 'gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic'.split('_'),
        weekdays: 'domenica_luned챙_marted챙_mercoled챙_gioved챙_venerd챙_sabato'.split(
            '_'
        ),
        weekdaysShort: 'dom_lun_mar_mer_gio_ven_sab'.split('_'),
        weekdaysMin: 'do_lu_ma_me_gi_ve_sa'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: function () {
                return (
                    '[Oggi a' +
                    (this.hours() > 1 ? 'lle ' : this.hours() === 0 ? ' ' : "ll'") +
                    ']LT'
                );
            },
            nextDay: function () {
                return (
                    '[Domani a' +
                    (this.hours() > 1 ? 'lle ' : this.hours() === 0 ? ' ' : "ll'") +
                    ']LT'
                );
            },
            nextWeek: function () {
                return (
                    'dddd [a' +
                    (this.hours() > 1 ? 'lle ' : this.hours() === 0 ? ' ' : "ll'") +
                    ']LT'
                );
            },
            lastDay: function () {
                return (
                    '[Ieri a' +
                    (this.hours() > 1 ? 'lle ' : this.hours() === 0 ? ' ' : "ll'") +
                    ']LT'
                );
            },
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                        return (
                            '[La scorsa] dddd [a' +
                            (this.hours() > 1
                                ? 'lle '
                                : this.hours() === 0
                                    ? ' '
                                    : "ll'") +
                            ']LT'
                        );
                    default:
                        return (
                            '[Lo scorso] dddd [a' +
                            (this.hours() > 1
                                ? 'lle '
                                : this.hours() === 0
                                    ? ' '
                                    : "ll'") +
                            ']LT'
                        );
                }
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: 'tra %s',
            past: '%s fa',
            s: 'alcuni secondi',
            ss: '%d secondi',
            m: 'un minuto',
            mm: '%d minuti',
            h: "un'ora",
            hh: '%d ore',
            d: 'un giorno',
            dd: '%d giorni',
            w: 'una settimana',
            ww: '%d settimane',
            M: 'un mese',
            MM: '%d mesi',
            y: 'un anno',
            yy: '%d anni',
        },
        dayOfMonthOrdinalParse: /\d{1,2}쨘/,
        ordinal: '%d쨘',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('ja', {
        eras: [
            {
                since: '2019-05-01',
                offset: 1,
                name: '餓ㅵ뭽',
                narrow: '��',
                abbr: 'R',
            },
            {
                since: '1989-01-08',
                until: '2019-04-30',
                offset: 1,
                name: '亮녔닇',
                narrow: '��',
                abbr: 'H',
            },
            {
                since: '1926-12-25',
                until: '1989-01-07',
                offset: 1,
                name: '��뭽',
                narrow: '��',
                abbr: 'S',
            },
            {
                since: '1912-07-30',
                until: '1926-12-24',
                offset: 1,
                name: '鸚㎪�',
                narrow: '��',
                abbr: 'T',
            },
            {
                since: '1873-01-01',
                until: '1912-07-29',
                offset: 6,
                name: '�롦꼇',
                narrow: '��',
                abbr: 'M',
            },
            {
                since: '0001-01-01',
                until: '1873-12-31',
                offset: 1,
                name: '蜈욘슗',
                narrow: 'AD',
                abbr: 'AD',
            },
            {
                since: '0000-12-31',
                until: -Infinity,
                offset: 1,
                name: '榮��껃뎺',
                narrow: 'BC',
                abbr: 'BC',
            },
        ],
        eraYearOrdinalRegex: /(��|\d+)亮�/,
        eraYearOrdinalParse: function (input, match) {
            return match[1] === '��' ? 1 : parseInt(match[1] || input, 10);
        },
        months: '1��_2��_3��_4��_5��_6��_7��_8��_9��_10��_11��_12��'.split('_'),
        monthsShort: '1��_2��_3��_4��_5��_6��_7��_8��_9��_10��_11��_12��'.split(
            '_'
        ),
        weekdays: '�ζ썫��_�덃썫��_�ユ썫��_麗닸썫��_�ⓩ썫��_�묉썫��_�잍썫��'.split('_'),
        weekdaysShort: '��_��_��_麗�_��_��_��'.split('_'),
        weekdaysMin: '��_��_��_麗�_��_��_��'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'YYYY/MM/DD',
            LL: 'YYYY亮퀾�뉲��',
            LLL: 'YYYY亮퀾�뉲�� HH:mm',
            LLLL: 'YYYY亮퀾�뉲�� dddd HH:mm',
            l: 'YYYY/MM/DD',
            ll: 'YYYY亮퀾�뉲��',
            lll: 'YYYY亮퀾�뉲�� HH:mm',
            llll: 'YYYY亮퀾�뉲��(ddd) HH:mm',
        },
        meridiemParse: /�덂뎺|�덂풄/i,
        isPM: function (input) {
            return input === '�덂풄';
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 12) {
                return '�덂뎺';
            } else {
                return '�덂풄';
            }
        },
        calendar: {
            sameDay: '[餓딀뿥] LT',
            nextDay: '[�롦뿥] LT',
            nextWeek: function (now) {
                if (now.week() !== this.week()) {
                    return '[�ι��]dddd LT';
                } else {
                    return 'dddd LT';
                }
            },
            lastDay: '[�ⓩ뿥] LT',
            lastWeek: function (now) {
                if (this.week() !== now.week()) {
                    return '[�덆��]dddd LT';
                } else {
                    return 'dddd LT';
                }
            },
            sameElse: 'L',
        },
        dayOfMonthOrdinalParse: /\d{1,2}��/,
        ordinal: function (number, period) {
            switch (period) {
                case 'y':
                    return number === 1 ? '�껃뭅' : number + '亮�';
                case 'd':
                case 'D':
                case 'DDD':
                    return number + '��';
                default:
                    return number;
            }
        },
        relativeTime: {
            future: '%s孃�',
            past: '%s��',
            s: '�곁쭜',
            ss: '%d燁�',
            m: '1��',
            mm: '%d��',
            h: '1�귡뼋',
            hh: '%d�귡뼋',
            d: '1��',
            dd: '%d��',
            M: '1�뜻쐢',
            MM: '%d�뜻쐢',
            y: '1亮�',
            yy: '%d亮�',
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('jv', {
        months: 'Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_Nopember_Desember'.split(
            '_'
        ),
        monthsShort: 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nop_Des'.split('_'),
        weekdays: 'Minggu_Senen_Seloso_Rebu_Kemis_Jemuwah_Septu'.split('_'),
        weekdaysShort: 'Min_Sen_Sel_Reb_Kem_Jem_Sep'.split('_'),
        weekdaysMin: 'Mg_Sn_Sl_Rb_Km_Jm_Sp'.split('_'),
        longDateFormat: {
            LT: 'HH.mm',
            LTS: 'HH.mm.ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY [pukul] HH.mm',
            LLLL: 'dddd, D MMMM YYYY [pukul] HH.mm',
        },
        meridiemParse: /enjing|siyang|sonten|ndalu/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'enjing') {
                return hour;
            } else if (meridiem === 'siyang') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === 'sonten' || meridiem === 'ndalu') {
                return hour + 12;
            }
        },
        meridiem: function (hours, minutes, isLower) {
            if (hours < 11) {
                return 'enjing';
            } else if (hours < 15) {
                return 'siyang';
            } else if (hours < 19) {
                return 'sonten';
            } else {
                return 'ndalu';
            }
        },
        calendar: {
            sameDay: '[Dinten puniko pukul] LT',
            nextDay: '[Mbenjang pukul] LT',
            nextWeek: 'dddd [pukul] LT',
            lastDay: '[Kala wingi pukul] LT',
            lastWeek: 'dddd [kepengker pukul] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'wonten ing %s',
            past: '%s ingkang kepengker',
            s: 'sawetawis detik',
            ss: '%d detik',
            m: 'setunggal menit',
            mm: '%d menit',
            h: 'setunggal jam',
            hh: '%d jam',
            d: 'sedinten',
            dd: '%d dinten',
            M: 'sewulan',
            MM: '%d wulan',
            y: 'setaun',
            yy: '%d taun',
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('ka', {
        months: '�섂깘�쒊깢�먤깲��_�쀡깞�묃깞�졹깢�먤깪��_�쎺깘�졹깴��_�먤깯�졹깦�싡깦_�쎺깘�섂깳��_�섂깢�쒊깦�■깦_�섂깢�싡깦�■깦_�먤깚�뺗깦�■깴��_�■깞�α깴�붳깫�묃깞�졹깦_�앩깷�㏇깮�쎺깙�붳깲��_�쒊깮�붳깫�묃깞�졹깦_�볚깞�쇹깞�쎺깙�붳깲��'.split(
            '_'
        ),
        monthsShort: '�섂깘��_�쀡깞��_�쎺깘��_�먤깯��_�쎺깘��_�섂깢��_�섂깢��_�먤깚��_�■깞��_�앩깷��_�쒊깮��_�볚깞��'.split('_'),
        weekdays: {
            standalone: '�쇹깢�섂깲��_�앩깲�ⓤ깘�묃깘�쀡깦_�■깘�쎺깿�먤깙�먤깤��_�앩깤��깿�먤깙�먤깤��_��깵�쀡깿�먤깙�먤깤��_�왾깘�졹깘�■깧�붳깢��_�ⓤ깘�묃깘�쀡깦'.split(
                '_'
            ),
            format: '�쇹깢�섂깲�먤깳_�앩깲�ⓤ깘�묃깘�쀡깳_�■깘�쎺깿�먤깙�먤깤��_�앩깤��깿�먤깙�먤깤��_��깵�쀡깿�먤깙�먤깤��_�왾깘�졹깘�■깧�붳깢��_�ⓤ깘�묃깘�쀡깳'.split(
                '_'
            ),
            isFormat: /(�п깦�쒊깘|�ⓤ깞�쎺깛�붳깚)/,
        },
        weekdaysShort: '�쇹깢��_�앩깲��_�■깘��_�앩깤��_��깵��_�왾깘��_�ⓤ깘��'.split('_'),
        weekdaysMin: '�쇹깢_�앩깲_�■깘_�앩깤_��깵_�왾깘_�ⓤ깘'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[�볚깺�붳깳] LT[-�뽥깞]',
            nextDay: '[��깢�먤깪] LT[-�뽥깞]',
            lastDay: '[�믟깵�ⓤ깦��] LT[-�뽥깞]',
            nextWeek: '[�ⓤ깞�쎺깛�붳깚] dddd LT[-�뽥깞]',
            lastWeek: '[�п깦�쒊깘] dddd LT-�뽥깞',
            sameElse: 'L',
        },
        relativeTime: {
            future: function (s) {
                return s.replace(/(�п깘��|�п깵��|�■깘�먤깤|�п깞��|�볚깺|�쀡깢)(��|��)/, function (
                    $0,
                    $1,
                    $2
                ) {
                    return $2 === '��' ? $1 + '�ⓤ깦' : $1 + $2 + '�ⓤ깦';
                });
            },
            past: function (s) {
                if (/(�п깘�쎺깦|�п깵�쀡깦|�■깘�먤깤��|�볚깺��|�쀡깢��)/.test(s)) {
                    return s.replace(/(��|��)$/, '�섂깳 �п깦��');
                }
                if (/�п깞�싡깦/.test(s)) {
                    return s.replace(/�п깞�싡깦$/, '�п깪�섂깳 �п깦��');
                }
                return s;
            },
            s: '�졹깘�쎺깛�붳깭�섂깫�� �п깘�쎺깦',
            ss: '%d �п깘�쎺깦',
            m: '�п깵�쀡깦',
            mm: '%d �п깵�쀡깦',
            h: '�■깘�먤깤��',
            hh: '%d �■깘�먤깤��',
            d: '�볚깺��',
            dd: '%d �볚깺��',
            M: '�쀡깢��',
            MM: '%d �쀡깢��',
            y: '�п깞�싡깦',
            yy: '%d �п깞�싡깦',
        },
        dayOfMonthOrdinalParse: /0|1-�싡깦|�쎺깞-\d{1,2}|\d{1,2}-��/,
        ordinal: function (number) {
            if (number === 0) {
                return number;
            }
            if (number === 1) {
                return number + '-�싡깦';
            }
            if (
                number < 20 ||
                (number <= 100 && number % 20 === 0) ||
                number % 100 === 0
            ) {
                return '�쎺깞-' + number;
            }
            return number + '-��';
        },
        week: {
            dow: 1,
            doy: 7,
        },
    });

    //! moment.js locale configuration

    var suffixes$1 = {
        0: '-��',
        1: '-��',
        2: '-��',
        3: '-��',
        4: '-��',
        5: '-��',
        6: '-��',
        7: '-��',
        8: '-��',
        9: '-��',
        10: '-��',
        20: '-��',
        30: '-��',
        40: '-��',
        50: '-��',
        60: '-��',
        70: '-��',
        80: '-��',
        90: '-��',
        100: '-��',
    };

    hooks.defineLocale('kk', {
        months: '�逵蠟�逵�_逵�極逵戟_戟逵���鈞_�����_劇逵劇��_劇逵���劇_��剋畇筠_�逵劇�鈞_���克奈橘筠克_�逵鈞逵戟_�逵�逵�逵_菌筠剋�棘��逵戟'.split(
            '_'
        ),
        monthsShort: '�逵蠟_逵�極_戟逵�_���_劇逵劇_劇逵�_��剋_�逵劇_���_�逵鈞_�逵�_菌筠剋'.split('_'),
        weekdays: '菌筠克�筠戟閨�_畇奈橘�筠戟閨�_�筠橘�筠戟閨�_����筠戟閨�_閨筠橘�筠戟閨�_菌耐劇逵_�筠戟閨�'.split(
            '_'
        ),
        weekdaysShort: '菌筠克_畇奈橘_�筠橘_���_閨筠橘_菌耐劇_�筠戟'.split('_'),
        weekdaysMin: '菌克_畇橘_�橘_��_閨橘_菌劇_�戟'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[�奈均�戟 �逵�逵�] LT',
            nextDay: '[���筠蠟 �逵�逵�] LT',
            nextWeek: 'dddd [�逵�逵�] LT',
            lastDay: '[�筠�筠 �逵�逵�] LT',
            lastWeek: '[斷�克筠戟 逵極�逵戟�蠟] dddd [�逵�逵�] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s ���戟畇筠',
            past: '%s 閨耐��戟',
            s: '閨��戟筠�筠 �筠克�戟畇',
            ss: '%d �筠克�戟畇',
            m: '閨�� 劇龜戟��',
            mm: '%d 劇龜戟��',
            h: '閨�� �逵�逵�',
            hh: '%d �逵�逵�',
            d: '閨�� 克奈戟',
            dd: '%d 克奈戟',
            M: '閨�� 逵橘',
            MM: '%d 逵橘',
            y: '閨�� 菌�剋',
            yy: '%d 菌�剋',
        },
        dayOfMonthOrdinalParse: /\d{1,2}-(��|��)/,
        ordinal: function (number) {
            var a = number % 10,
                b = number >= 100 ? 100 : null;
            return number + (suffixes$1[number] || suffixes$1[a] || suffixes$1[b]);
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var symbolMap$9 = {
            1: '��',
            2: '��',
            3: '��',
            4: '��',
            5: '��',
            6: '��',
            7: '��',
            8: '��',
            9: '��',
            0: '��',
        },
        numberMap$8 = {
            '��': '1',
            '��': '2',
            '��': '3',
            '��': '4',
            '��': '5',
            '��': '6',
            '��': '7',
            '��': '8',
            '��': '9',
            '��': '0',
        };

    hooks.defineLocale('km', {
        months: '�섂��싡왃_���삔옒�믟옑��_�섂왆�볚왃_�섂웳�잁왃_�㎭옝�쀡왃_�섂왅�먤왊�볚왃_�����믟��듻왃_�잁왆�졹왃_���됣윊�됣왃_�뤳왊�쎺왃_�쒊왅�끷윊�녲왅����_�믟윊�볚왋'.split(
            '_'
        ),
        monthsShort: '�섂��싡왃_���삔옒�믟옑��_�섂왆�볚왃_�섂웳�잁왃_�㎭옝�쀡왃_�섂왅�먤왊�볚왃_�����믟��듻왃_�잁왆�졹왃_���됣윊�됣왃_�뤳왊�쎺왃_�쒊왅�끷윊�녲왅����_�믟윊�볚왋'.split(
            '_'
        ),
        weekdays: '�㏇왃�묃왅�뤳윊��_�끷윇�볚윊��_�㏇엫�믟엩�뜬옔_�뽥왊��_�뽥윊�싡옞�잁윊�붳옃�료윂_�잁왊���믟옔_�잁웷�싡윂'.split('_'),
        weekdaysShort: '�㏇왃_��_��_��_�뽥윊��_�잁왊_��'.split('_'),
        weekdaysMin: '�㏇왃_��_��_��_�뽥윊��_�잁왊_��'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        meridiemParse: /�뽥윊�싡왇��|�쎺윊�꾞왃��/,
        isPM: function (input) {
            return input === '�쎺윊�꾞왃��';
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 12) {
                return '�뽥윊�싡왇��';
            } else {
                return '�쎺윊�꾞왃��';
            }
        },
        calendar: {
            sameDay: '[�먤윊�꾞웵�볚웳�� �섂웾�꾞엫] LT',
            nextDay: '[�잁윊�㏇웴�� �섂웾�꾞엫] LT',
            nextWeek: 'dddd [�섂웾�꾞엫] LT',
            lastDay: '[�섂윊�잁왅�쎺옒�료엵 �섂웾�꾞엫] LT',
            lastWeek: 'dddd [�잁옍�믟옃�뜬옞�띮옒�삔옋] [�섂웾�꾞엫] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s�묃���',
            past: '%s�섂왊��',
            s: '�붳웾�삔옋�믟옒�뜬옋�쒊왅�볚왃�묃왆',
            ss: '%d �쒊왅�볚왃�묃왆',
            m: '�섂왌�쇹옋�뜬옉��',
            mm: '%d �볚왃�묃왆',
            h: '�섂왌�쇹옒�됣웶��',
            hh: '%d �섂웾�꾞엫',
            d: '�섂왌�쇹옄�믟엫��',
            dd: '%d �먤윊�꾞웵',
            M: '�섂왌�쇹엨��',
            MM: '%d �곢웴',
            y: '�섂왌�쇹엱�믟옋�뜬웺',
            yy: '%d �녲윊�볚왃��',
        },
        dayOfMonthOrdinalParse: /�묃왆\d{1,2}/,
        ordinal: '�묃왆%d',
        preparse: function (string) {
            return string.replace(/[�■윟�ａ윣�α윦�㎭윩�⒰윝]/g, function (match) {
                return numberMap$8[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap$9[match];
            });
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var symbolMap$a = {
            1: '潟�',
            2: '潟�',
            3: '潟�',
            4: '潟�',
            5: '潟�',
            6: '潟�',
            7: '潟�',
            8: '潟�',
            9: '潟�',
            0: '潟�',
        },
        numberMap$9 = {
            '潟�': '1',
            '潟�': '2',
            '潟�': '3',
            '潟�': '4',
            '潟�': '5',
            '潟�': '6',
            '潟�': '7',
            '潟�': '8',
            '潟�': '9',
            '潟�': '0',
        };

    hooks.defineLocale('kn', {
        months: '淅쒉꺼淅듀껐淅�_淅ム퀐淅о퀙淅겯껨淅겯꼬_淅�꼐淅겯퀙淅싟퀙_淅뤲꺾潟띭껐淅욈께潟�_淅�퀐潟�_淅쒉퀌淅ⓣ퀙_淅쒉퀋淅꿋퀐潟�_淅녱쿁淅멘퀙淅잀퀙_淅멘퀐淅む퀙淅잀퀐淅귖껄淅겯퀙_淅끶쾿潟띭쿊潟녱퀌潟뺖껄淅겯퀙_淅ⓣ껨潟녱쾫淅о껐潟�_淅□꼬淅멘퀐淅귖껄淅겯퀙'.split(
            '_'
        ),
        monthsShort: '淅쒉꺼_淅ム퀐淅о퀙淅�_淅�꼐淅겯퀙淅싟퀙_淅뤲꺾潟띭껐淅욈께潟�_淅�퀐潟�_淅쒉퀌淅ⓣ퀙_淅쒉퀋淅꿋퀐潟�_淅녱쿁淅멘퀙淅잀퀙_淅멘퀐淅む퀙淅잀퀐淅�_淅끶쾿潟띭쿊潟녱퀌潟�_淅ⓣ껨潟녱쾫_淅□꼬淅멘퀐淅�'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: '淅�꼐淅ⓣ퀋淅듀꼐淅�_淅멘퀐潟귖퀡淅�껨淅약껐_淅�쾫淅쀠껙淅듀꼐淅�_淅о퀋淅㏅껨淅약껐_淅쀠퀋淅겯퀋淅듀꼐淅�_淅뜩퀋淅뺖퀙淅겯껨淅약껐_淅뜩꺼淅욈껨淅약껐'.split(
            '_'
        ),
        weekdaysShort: '淅�꼐淅ⓣ퀋_淅멘퀐潟귖퀡淅�_淅�쾫淅쀠껙_淅о퀋淅�_淅쀠퀋淅겯퀋_淅뜩퀋淅뺖퀙淅�_淅뜩꺼淅�'.split('_'),
        weekdaysMin: '淅�꼐_淅멘퀐潟귖퀡_淅�쾫_淅о퀋_淅쀠퀋_淅뜩퀋_淅�'.split('_'),
        longDateFormat: {
            LT: 'A h:mm',
            LTS: 'A h:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY, A h:mm',
            LLLL: 'dddd, D MMMM YYYY, A h:mm',
        },
        calendar: {
            sameDay: '[淅뉋쾫淅╆퀋] LT',
            nextDay: '[淅ⓣ꼐淅녀퀐] LT',
            nextWeek: 'dddd, LT',
            lastDay: '[淅ⓣ꼬淅ⓣ퀙淅ⓣ퀐] LT',
            lastWeek: '[淅뺖퀐潟귖꺼潟녱껏] dddd, LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s 淅ⓣ쾫淅ㅰ껐',
            past: '%s 淅밝꼬淅귖꺅潟�',
            s: '淅뺖퀐淅꿋껨潟� 淅뺖퀙淅룅깼淅쀠껙潟�',
            ss: '%d 淅멘퀐淅뺖퀐淅귖깹潟곟쿁淅녀퀋',
            m: '淅믞쾫淅╆퀋 淅ⓣ꼬淅�꼬淅�',
            mm: '%d 淅ⓣ꼬淅�꼬淅�',
            h: '淅믞쾫淅╆퀋 淅쀠쾫淅잀퀐',
            hh: '%d 淅쀠쾫淅잀퀐',
            d: '淅믞쾫淅╆퀋 淅╆꼬淅�',
            dd: '%d 淅╆꼬淅�',
            M: '淅믞쾫淅╆퀋 淅ㅰ꼬淅귖쿁淅녀퀋',
            MM: '%d 淅ㅰ꼬淅귖쿁淅녀퀋',
            y: '淅믞쾫淅╆퀋 淅듀껐潟띭껭',
            yy: '%d 淅듀껐潟띭껭',
        },
        preparse: function (string) {
            return string.replace(/[潟㏅낏潟⒯나潟ム낚潟�낟潟�낌]/g, function (match) {
                return numberMap$9[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap$a[match];
            });
        },
        meridiemParse: /淅겯꼐淅ㅰ퀙淅겯꼬|淅о퀐淅녀꼬淅쀠퀙淅쀠퀐|淅�꺌潟띭껏淅약껸潟띭꺼|淅멘쾫淅쒉퀐/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '淅겯꼐淅ㅰ퀙淅겯꼬') {
                return hour < 4 ? hour : hour + 12;
            } else if (meridiem === '淅о퀐淅녀꼬淅쀠퀙淅쀠퀐') {
                return hour;
            } else if (meridiem === '淅�꺌潟띭껏淅약껸潟띭꺼') {
                return hour >= 10 ? hour : hour + 12;
            } else if (meridiem === '淅멘쾫淅쒉퀐') {
                return hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 4) {
                return '淅겯꼐淅ㅰ퀙淅겯꼬';
            } else if (hour < 10) {
                return '淅о퀐淅녀꼬淅쀠퀙淅쀠퀐';
            } else if (hour < 17) {
                return '淅�꺌潟띭껏淅약껸潟띭꺼';
            } else if (hour < 20) {
                return '淅멘쾫淅쒉퀐';
            } else {
                return '淅겯꼐淅ㅰ퀙淅겯꼬';
            }
        },
        dayOfMonthOrdinalParse: /\d{1,2}(淅ⓣ퀐潟�)/,
        ordinal: function (number) {
            return number + '淅ⓣ퀐潟�';
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 6, // The week that contains Jan 6th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('ko', {
        months: '1��_2��_3��_4��_5��_6��_7��_8��_9��_10��_11��_12��'.split('_'),
        monthsShort: '1��_2��_3��_4��_5��_6��_7��_8��_9��_10��_11��_12��'.split(
            '_'
        ),
        weekdays: '�쇱슂��_�붿슂��_�붿슂��_�섏슂��_紐⑹슂��_湲덉슂��_�좎슂��'.split('_'),
        weekdaysShort: '��_��_��_��_紐�_湲�_��'.split('_'),
        weekdaysMin: '��_��_��_��_紐�_湲�_��'.split('_'),
        longDateFormat: {
            LT: 'A h:mm',
            LTS: 'A h:mm:ss',
            L: 'YYYY.MM.DD.',
            LL: 'YYYY�� MMMM D��',
            LLL: 'YYYY�� MMMM D�� A h:mm',
            LLLL: 'YYYY�� MMMM D�� dddd A h:mm',
            l: 'YYYY.MM.DD.',
            ll: 'YYYY�� MMMM D��',
            lll: 'YYYY�� MMMM D�� A h:mm',
            llll: 'YYYY�� MMMM D�� dddd A h:mm',
        },
        calendar: {
            sameDay: '�ㅻ뒛 LT',
            nextDay: '�댁씪 LT',
            nextWeek: 'dddd LT',
            lastDay: '�댁젣 LT',
            lastWeek: '吏��쒖＜ dddd LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s ��',
            past: '%s ��',
            s: '紐� 珥�',
            ss: '%d珥�',
            m: '1遺�',
            mm: '%d遺�',
            h: '�� �쒓컙',
            hh: '%d�쒓컙',
            d: '�섎（',
            dd: '%d��',
            M: '�� ��',
            MM: '%d��',
            y: '�� ��',
            yy: '%d��',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(��|��|二�)/,
        ordinal: function (number, period) {
            switch (period) {
                case 'd':
                case 'D':
                case 'DDD':
                    return number + '��';
                case 'M':
                    return number + '��';
                case 'w':
                case 'W':
                    return number + '二�';
                default:
                    return number;
            }
        },
        meridiemParse: /�ㅼ쟾|�ㅽ썑/,
        isPM: function (token) {
            return token === '�ㅽ썑';
        },
        meridiem: function (hour, minute, isUpper) {
            return hour < 12 ? '�ㅼ쟾' : '�ㅽ썑';
        },
    });

    //! moment.js locale configuration

    var symbolMap$b = {
            1: '蔑',
            2: '冥',
            3: '名',
            4: '命',
            5: '明',
            6: '暝',
            7: '椧',
            8: '溟',
            9: '皿',
            0: '�',
        },
        numberMap$a = {
            '蔑': '1',
            '冥': '2',
            '名': '3',
            '命': '4',
            '明': '5',
            '暝': '6',
            '椧': '7',
            '溟': '8',
            '皿': '9',
            '�': '0',
        },
        months$8 = [
            '沕碼���� 膜����',
            '娩�磨碼魔',
            '痲碼万碼邈',
            '��卍碼�',
            '痲碼�碼邈',
            '幕�万��邈碼�',
            '魔����万',
            '痲碼磨',
            '痲������',
            '魔娩邈��� �����',
            '魔娩邈��� 膜����',
            '�碼���� ��沕��',
        ];

    hooks.defineLocale('ku', {
        months: months$8,
        monthsShort: months$8,
        weekdays: '���뚖꺲다뉍�뚖끯끯뉍��_膜��娩��뚖끯끯뉍��_卍�娩��뚖끯끯뉍��_��碼邈娩��뚖끯끯뉍��_毛��寞娩��뚖끯끯뉍��_���뚘뚖녬�_娩��뚖끯끯뉍��'.split(
            '_'
        ),
        weekdaysShort: '���뚖꺲다뉍�뚖�_膜��娩��뚖�_卍�娩��뚖�_��碼邈娩��뚖�_毛��寞娩��뚖�_���뚘뚖녬�_娩��뚖끯끯뉍��'.split(
            '_'
        ),
        weekdaysMin: '�_膜_卍_�_毛_�_娩'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        meridiemParse: /痲��碼邈���|磨��뚘뚕Ω녬�/,
        isPM: function (input) {
            return /痲��碼邈���/.test(input);
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 12) {
                return '磨��뚘뚕Ω녬�';
            } else {
                return '痲��碼邈���';
            }
        },
        calendar: {
            sameDay: '[痲��뚖끮글� �碼魔���邈] LT',
            nextDay: '[磨��뚘뚕Ω녬� �碼魔���邈] LT',
            nextWeek: 'dddd [�碼魔���邈] LT',
            lastDay: '[膜���� �碼魔���邈] LT',
            lastWeek: 'dddd [�碼魔���邈] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '���� %s',
            past: '%s',
            s: '���뚖녩� �邈���뚘뚖뉍�뚖�',
            ss: '�邈���� %d',
            m: '���뚖� 漠����뚖�',
            mm: '%d 漠����뚖�',
            h: '���뚖� �碼魔���邈',
            hh: '%d �碼魔���邈',
            d: '���뚖� ���',
            dd: '%d ���',
            M: '���뚖� �碼�彌',
            MM: '%d �碼�彌',
            y: '���뚖� 卍碼湄',
            yy: '%d 卍碼湄',
        },
        preparse: function (string) {
            return string
                .replace(/[蔑冥名命明暝椧溟皿�]/g, function (match) {
                    return numberMap$a[match];
                })
                .replace(/�/g, ',');
        },
        postformat: function (string) {
            return string
                .replace(/\d/g, function (match) {
                    return symbolMap$b[match];
                })
                .replace(/,/g, '�');
        },
        week: {
            dow: 6, // Saturday is the first day of the week.
            doy: 12, // The week that contains Jan 12th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var suffixes$2 = {
        0: '-�奈',
        1: '-�龜',
        2: '-�龜',
        3: '-�奈',
        4: '-�奈',
        5: '-�龜',
        6: '-��',
        7: '-�龜',
        8: '-�龜',
        9: '-��',
        10: '-��',
        20: '-��',
        30: '-��',
        40: '-��',
        50: '-�奈',
        60: '-��',
        70: '-�龜',
        80: '-�龜',
        90: '-��',
        100: '-�奈',
    };

    hooks.defineLocale('ky', {
        months: '�戟勻逵��_�筠勻�逵剋�_劇逵��_逵極�筠剋�_劇逵橘_龜�戟�_龜�剋�_逵勻均���_�筠戟��閨��_棘克��閨��_戟棘�閨��_畇筠克逵閨��'.split(
            '_'
        ),
        monthsShort: '�戟勻_�筠勻_劇逵��_逵極�_劇逵橘_龜�戟�_龜�剋�_逵勻均_�筠戟_棘克�_戟棘�_畇筠克'.split(
            '_'
        ),
        weekdays: '�筠克�筠劇閨龜_�奈橘�旦劇閨奈_珪筠橘�筠劇閨龜_珪逵��筠劇閨龜_�筠橘�筠劇閨龜_��劇逵_��筠劇閨龜'.split(
            '_'
        ),
        weekdaysShort: '�筠克_�奈橘_珪筠橘_珪逵�_�筠橘_��劇_��筠'.split('_'),
        weekdaysMin: '�克_�橘_珪橘_珪�_�橘_�劇_��'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[�奈均奈戟 �逵逵�] LT',
            nextDay: '[葵��筠蠟 �逵逵�] LT',
            nextWeek: 'dddd [�逵逵�] LT',
            lastDay: '[�筠��� �逵逵�] LT',
            lastWeek: '[斷�克旦戟 逵極�逵戟�戟] dddd [克奈戟奈] [�逵逵�] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s 龜�龜戟畇筠',
            past: '%s 劇���戟',
            s: '閨龜�戟筠�筠 �筠克�戟畇',
            ss: '%d �筠克�戟畇',
            m: '閨龜� 劇奈戟旦�',
            mm: '%d 劇奈戟旦�',
            h: '閨龜� �逵逵�',
            hh: '%d �逵逵�',
            d: '閨龜� 克奈戟',
            dd: '%d 克奈戟',
            M: '閨龜� 逵橘',
            MM: '%d 逵橘',
            y: '閨龜� 菌�剋',
            yy: '%d 菌�剋',
        },
        dayOfMonthOrdinalParse: /\d{1,2}-(�龜|��|�奈|��)/,
        ordinal: function (number) {
            var a = number % 10,
                b = number >= 100 ? 100 : null;
            return number + (suffixes$2[number] || suffixes$2[a] || suffixes$2[b]);
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    function processRelativeTime$6(number, withoutSuffix, key, isFuture) {
        var format = {
            m: ['eng Minutt', 'enger Minutt'],
            h: ['eng Stonn', 'enger Stonn'],
            d: ['een Dag', 'engem Dag'],
            M: ['ee Mount', 'engem Mount'],
            y: ['ee Joer', 'engem Joer'],
        };
        return withoutSuffix ? format[key][0] : format[key][1];
    }
    function processFutureTime(string) {
        var number = string.substr(0, string.indexOf(' '));
        if (eifelerRegelAppliesToNumber(number)) {
            return 'a ' + string;
        }
        return 'an ' + string;
    }
    function processPastTime(string) {
        var number = string.substr(0, string.indexOf(' '));
        if (eifelerRegelAppliesToNumber(number)) {
            return 'viru ' + string;
        }
        return 'virun ' + string;
    }
    /**
     * Returns true if the word before the given number loses the '-n' ending.
     * e.g. 'an 10 Deeg' but 'a 5 Deeg'
     *
     * @param number {integer}
     * @returns {boolean}
     */
    function eifelerRegelAppliesToNumber(number) {
        number = parseInt(number, 10);
        if (isNaN(number)) {
            return false;
        }
        if (number < 0) {
            // Negative Number --> always true
            return true;
        } else if (number < 10) {
            // Only 1 digit
            if (4 <= number && number <= 7) {
                return true;
            }
            return false;
        } else if (number < 100) {
            // 2 digits
            var lastDigit = number % 10,
                firstDigit = number / 10;
            if (lastDigit === 0) {
                return eifelerRegelAppliesToNumber(firstDigit);
            }
            return eifelerRegelAppliesToNumber(lastDigit);
        } else if (number < 10000) {
            // 3 or 4 digits --> recursively check first digit
            while (number >= 10) {
                number = number / 10;
            }
            return eifelerRegelAppliesToNumber(number);
        } else {
            // Anything larger than 4 digits: recursively check first n-3 digits
            number = number / 1000;
            return eifelerRegelAppliesToNumber(number);
        }
    }

    hooks.defineLocale('lb', {
        months: 'Januar_Februar_M채erz_Abr챘ll_Mee_Juni_Juli_August_September_Oktober_November_Dezember'.split(
            '_'
        ),
        monthsShort: 'Jan._Febr._Mrz._Abr._Mee_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'Sonndeg_M챕indeg_D챘nschdeg_M챘ttwoch_Donneschdeg_Freideg_Samschdeg'.split(
            '_'
        ),
        weekdaysShort: 'So._M챕._D챘._M챘._Do._Fr._Sa.'.split('_'),
        weekdaysMin: 'So_M챕_D챘_M챘_Do_Fr_Sa'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'H:mm [Auer]',
            LTS: 'H:mm:ss [Auer]',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY H:mm [Auer]',
            LLLL: 'dddd, D. MMMM YYYY H:mm [Auer]',
        },
        calendar: {
            sameDay: '[Haut um] LT',
            sameElse: 'L',
            nextDay: '[Muer um] LT',
            nextWeek: 'dddd [um] LT',
            lastDay: '[G챘schter um] LT',
            lastWeek: function () {
                // Different date string for 'D챘nschdeg' (Tuesday) and 'Donneschdeg' (Thursday) due to phonological rule
                switch (this.day()) {
                    case 2:
                    case 4:
                        return '[Leschten] dddd [um] LT';
                    default:
                        return '[Leschte] dddd [um] LT';
                }
            },
        },
        relativeTime: {
            future: processFutureTime,
            past: processPastTime,
            s: 'e puer Sekonnen',
            ss: '%d Sekonnen',
            m: processRelativeTime$6,
            mm: '%d Minutten',
            h: processRelativeTime$6,
            hh: '%d Stonnen',
            d: processRelativeTime$6,
            dd: '%d Deeg',
            M: processRelativeTime$6,
            MM: '%d M챕int',
            y: processRelativeTime$6,
            yy: '%d Joer',
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('lo', {
        months: '僊□볍僊뉋틒僊�틯_僊곟보僊□틷僊�_僊□볕僊쇸볏_先�僊□벳僊�_僊왽볘僊붲벳僊겯틷僊�_僊□병僊뽤보僊쇸볏_僊곟퍖僊�별僊곟본僊�_僊む병僊뉋벴僊�_僊곟볍僊쇸틡僊�_僊뺖보僊�볏_僊왽별僊댽병僊�_僊쀠볍僊쇸벨僊�'.split(
            '_'
        ),
        monthsShort: '僊□볍僊뉋틒僊�틯_僊곟보僊□틷僊�_僊□볕僊쇸볏_先�僊□벳僊�_僊왽볘僊붲벳僊겯틷僊�_僊□병僊뽤보僊쇸볏_僊곟퍖僊�별僊곟본僊�_僊む병僊뉋벴僊�_僊곟볍僊쇸틡僊�_僊뺖보僊�볏_僊왽별僊댽병僊�_僊쀠볍僊쇸벨僊�'.split(
            '_'
        ),
        weekdays: '僊�볏僊쀠병僊�_僊댽볍僊�_僊�볍僊뉋틖僊꿋틯_僊왽보僊�_僊왽별僊ム볍僊�_僊む보僊�_先�僊む본僊�'.split('_'),
        weekdaysShort: '僊쀠병僊�_僊댽볍僊�_僊�볍僊뉋틖僊꿋틯_僊왽보僊�_僊왽별僊ム볍僊�_僊む보僊�_先�僊む본僊�'.split('_'),
        weekdaysMin: '僊�_僊�_僊�틖_僊�_僊왽벴_僊む틒_僊�'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: '僊㏅볍僊셝ddd D MMMM YYYY HH:mm',
        },
        meridiemParse: /僊뺖벼僊쇸�僊듺본先됢볏|僊뺖벼僊쇸퍊僊�틚/,
        isPM: function (input) {
            return input === '僊뺖벼僊쇸퍊僊�틚';
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 12) {
                return '僊뺖벼僊쇸�僊듺본先됢볏';
            } else {
                return '僊뺖벼僊쇸퍊僊�틚';
            }
        },
        calendar: {
            sameDay: '[僊□볜先됢틯僊듀퍒先�僊㏅벤僊�] LT',
            nextDay: '[僊□볜先됢벼僊룅퍑僊쇸�僊㏅벤僊�] LT',
            nextWeek: '[僊㏅볍僊�]dddd[先쒉퍒僊꿋�僊㏅벤僊�] LT',
            lastDay: '[僊□볜先됢벨僊꿋틯僊쇸볕先됢�僊㏅벤僊�] LT',
            lastWeek: '[僊㏅볍僊�]dddd[先곟벤先됢벨僊쇸볕先됢�僊㏅벤僊�] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '僊�볕僊� %s',
            past: '%s僊쒉퍑僊꿋틯僊□볏',
            s: '僊싟퍖先댽�僊쀠본先댽볏先꺺틪僊㏅병僊쇸볏僊쀠볕',
            ss: '%d 僊㏅병僊쇸볏僊쀠볕',
            m: '1 僊쇸볏僊쀠볕',
            mm: '%d 僊쇸볏僊쀠볕',
            h: '1 僊듺본先댽벨先귖벙僊�',
            hh: '%d 僊듺본先댽벨先귖벙僊�',
            d: '1 僊□볜先�',
            dd: '%d 僊□볜先�',
            M: '1 先�僊붲볜僊�틯',
            MM: '%d 先�僊붲볜僊�틯',
            y: '1 僊쎹볕',
            yy: '%d 僊쎹볕',
        },
        dayOfMonthOrdinalParse: /(僊쀠볕先�)\d{1,2}/,
        ordinal: function (number) {
            return '僊쀠볕先�' + number;
        },
    });

    //! moment.js locale configuration

    var units = {
        ss: 'sekund휊_sekund탑i킬_sekundes',
        m: 'minut휊_minut휊s_minut휌',
        mm: 'minut휊s_minu훾i킬_minutes',
        h: 'valanda_valandos_valand훳',
        hh: 'valandos_valand킬_valandas',
        d: 'diena_dienos_dien훳',
        dd: 'dienos_dien킬_dienas',
        M: 'm휊nuo_m휊nesio_m휊nes캄',
        MM: 'm휊nesiai_m휊nesi킬_m휊nesius',
        y: 'metai_met킬_metus',
        yy: 'metai_met킬_metus',
    };
    function translateSeconds(number, withoutSuffix, key, isFuture) {
        if (withoutSuffix) {
            return 'kelios sekund휊s';
        } else {
            return isFuture ? 'keli킬 sekund탑i킬' : 'kelias sekundes';
        }
    }
    function translateSingular(number, withoutSuffix, key, isFuture) {
        return withoutSuffix
            ? forms(key)[0]
            : isFuture
                ? forms(key)[1]
                : forms(key)[2];
    }
    function special(number) {
        return number % 10 === 0 || (number > 10 && number < 20);
    }
    function forms(key) {
        return units[key].split('_');
    }
    function translate$6(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        if (number === 1) {
            return (
                result + translateSingular(number, withoutSuffix, key[0], isFuture)
            );
        } else if (withoutSuffix) {
            return result + (special(number) ? forms(key)[1] : forms(key)[0]);
        } else {
            if (isFuture) {
                return result + forms(key)[1];
            } else {
                return result + (special(number) ? forms(key)[1] : forms(key)[2]);
            }
        }
    }
    hooks.defineLocale('lt', {
        months: {
            format: 'sausio_vasario_kovo_baland탑io_gegu탑휊s_bir탑elio_liepos_rugpj큰훾io_rugs휊jo_spalio_lapkri훾io_gruod탑io'.split(
                '_'
            ),
            standalone: 'sausis_vasaris_kovas_balandis_gegu탑휊_bir탑elis_liepa_rugpj큰tis_rugs휊jis_spalis_lapkritis_gruodis'.split(
                '_'
            ),
            isFormat: /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?|MMMM?(\[[^\[\]]*\]|\s)+D[oD]?/,
        },
        monthsShort: 'sau_vas_kov_bal_geg_bir_lie_rgp_rgs_spa_lap_grd'.split('_'),
        weekdays: {
            format: 'sekmadien캄_pirmadien캄_antradien캄_tre훾iadien캄_ketvirtadien캄_penktadien캄_큄e큄tadien캄'.split(
                '_'
            ),
            standalone: 'sekmadienis_pirmadienis_antradienis_tre훾iadienis_ketvirtadienis_penktadienis_큄e큄tadienis'.split(
                '_'
            ),
            isFormat: /dddd HH:mm/,
        },
        weekdaysShort: 'Sek_Pir_Ant_Tre_Ket_Pen_힋e큄'.split('_'),
        weekdaysMin: 'S_P_A_T_K_Pn_힋'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'YYYY-MM-DD',
            LL: 'YYYY [m.] MMMM D [d.]',
            LLL: 'YYYY [m.] MMMM D [d.], HH:mm [val.]',
            LLLL: 'YYYY [m.] MMMM D [d.], dddd, HH:mm [val.]',
            l: 'YYYY-MM-DD',
            ll: 'YYYY [m.] MMMM D [d.]',
            lll: 'YYYY [m.] MMMM D [d.], HH:mm [val.]',
            llll: 'YYYY [m.] MMMM D [d.], ddd, HH:mm [val.]',
        },
        calendar: {
            sameDay: '[힋iandien] LT',
            nextDay: '[Rytoj] LT',
            nextWeek: 'dddd LT',
            lastDay: '[Vakar] LT',
            lastWeek: '[Pra휊jus캄] dddd LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'po %s',
            past: 'prie큄 %s',
            s: translateSeconds,
            ss: translate$6,
            m: translateSingular,
            mm: translate$6,
            h: translateSingular,
            hh: translate$6,
            d: translateSingular,
            dd: translate$6,
            M: translateSingular,
            MM: translate$6,
            y: translateSingular,
            yy: translate$6,
        },
        dayOfMonthOrdinalParse: /\d{1,2}-oji/,
        ordinal: function (number) {
            return number + '-oji';
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var units$1 = {
        ss: 'sekundes_sekund휆m_sekunde_sekundes'.split('_'),
        m: 'min큰tes_min큰t휆m_min큰te_min큰tes'.split('_'),
        mm: 'min큰tes_min큰t휆m_min큰te_min큰tes'.split('_'),
        h: 'stundas_stund훮m_stunda_stundas'.split('_'),
        hh: 'stundas_stund훮m_stunda_stundas'.split('_'),
        d: 'dienas_dien훮m_diena_dienas'.split('_'),
        dd: 'dienas_dien훮m_diena_dienas'.split('_'),
        M: 'm휆ne큄a_m휆ne큄iem_m휆nesis_m휆ne큄i'.split('_'),
        MM: 'm휆ne큄a_m휆ne큄iem_m휆nesis_m휆ne큄i'.split('_'),
        y: 'gada_gadiem_gads_gadi'.split('_'),
        yy: 'gada_gadiem_gads_gadi'.split('_'),
    };
    /**
     * @param withoutSuffix boolean true = a length of time; false = before/after a period of time.
     */
    function format$1(forms, number, withoutSuffix) {
        if (withoutSuffix) {
            // E.g. "21 min큰te", "3 min큰tes".
            return number % 10 === 1 && number % 100 !== 11 ? forms[2] : forms[3];
        } else {
            // E.g. "21 min큰tes" as in "p휆c 21 min큰tes".
            // E.g. "3 min큰t휆m" as in "p휆c 3 min큰t휆m".
            return number % 10 === 1 && number % 100 !== 11 ? forms[0] : forms[1];
        }
    }
    function relativeTimeWithPlural$1(number, withoutSuffix, key) {
        return number + ' ' + format$1(units$1[key], number, withoutSuffix);
    }
    function relativeTimeWithSingular(number, withoutSuffix, key) {
        return format$1(units$1[key], number, withoutSuffix);
    }
    function relativeSeconds(number, withoutSuffix) {
        return withoutSuffix ? 'da탑as sekundes' : 'da탑훮m sekund휆m';
    }

    hooks.defineLocale('lv', {
        months: 'janv훮ris_febru훮ris_marts_apr카lis_maijs_j큰nijs_j큰lijs_augusts_septembris_oktobris_novembris_decembris'.split(
            '_'
        ),
        monthsShort: 'jan_feb_mar_apr_mai_j큰n_j큰l_aug_sep_okt_nov_dec'.split('_'),
        weekdays: 'sv휆tdiena_pirmdiena_otrdiena_tre큄diena_ceturtdiena_piektdiena_sestdiena'.split(
            '_'
        ),
        weekdaysShort: 'Sv_P_O_T_C_Pk_S'.split('_'),
        weekdaysMin: 'Sv_P_O_T_C_Pk_S'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY.',
            LL: 'YYYY. [gada] D. MMMM',
            LLL: 'YYYY. [gada] D. MMMM, HH:mm',
            LLLL: 'YYYY. [gada] D. MMMM, dddd, HH:mm',
        },
        calendar: {
            sameDay: '[힋odien pulksten] LT',
            nextDay: '[R카t pulksten] LT',
            nextWeek: 'dddd [pulksten] LT',
            lastDay: '[Vakar pulksten] LT',
            lastWeek: '[Pag훮ju큄훮] dddd [pulksten] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'p휆c %s',
            past: 'pirms %s',
            s: relativeSeconds,
            ss: relativeTimeWithPlural$1,
            m: relativeTimeWithSingular,
            mm: relativeTimeWithPlural$1,
            h: relativeTimeWithSingular,
            hh: relativeTimeWithPlural$1,
            d: relativeTimeWithSingular,
            dd: relativeTimeWithPlural$1,
            M: relativeTimeWithSingular,
            MM: relativeTimeWithPlural$1,
            y: relativeTimeWithSingular,
            yy: relativeTimeWithPlural$1,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var translator = {
        words: {
            //Different grammatical cases
            ss: ['sekund', 'sekunda', 'sekundi'],
            m: ['jedan minut', 'jednog minuta'],
            mm: ['minut', 'minuta', 'minuta'],
            h: ['jedan sat', 'jednog sata'],
            hh: ['sat', 'sata', 'sati'],
            dd: ['dan', 'dana', 'dana'],
            MM: ['mjesec', 'mjeseca', 'mjeseci'],
            yy: ['godina', 'godine', 'godina'],
        },
        correctGrammaticalCase: function (number, wordKey) {
            return number === 1
                ? wordKey[0]
                : number >= 2 && number <= 4
                    ? wordKey[1]
                    : wordKey[2];
        },
        translate: function (number, withoutSuffix, key) {
            var wordKey = translator.words[key];
            if (key.length === 1) {
                return withoutSuffix ? wordKey[0] : wordKey[1];
            } else {
                return (
                    number +
                    ' ' +
                    translator.correctGrammaticalCase(number, wordKey)
                );
            }
        },
    };

    hooks.defineLocale('me', {
        months: 'januar_februar_mart_april_maj_jun_jul_avgust_septembar_oktobar_novembar_decembar'.split(
            '_'
        ),
        monthsShort: 'jan._feb._mar._apr._maj_jun_jul_avg._sep._okt._nov._dec.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'nedjelja_ponedjeljak_utorak_srijeda_훾etvrtak_petak_subota'.split(
            '_'
        ),
        weekdaysShort: 'ned._pon._uto._sri._훾et._pet._sub.'.split('_'),
        weekdaysMin: 'ne_po_ut_sr_훾e_pe_su'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY H:mm',
            LLLL: 'dddd, D. MMMM YYYY H:mm',
        },
        calendar: {
            sameDay: '[danas u] LT',
            nextDay: '[sjutra u] LT',

            nextWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[u] [nedjelju] [u] LT';
                    case 3:
                        return '[u] [srijedu] [u] LT';
                    case 6:
                        return '[u] [subotu] [u] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[u] dddd [u] LT';
                }
            },
            lastDay: '[ju훾e u] LT',
            lastWeek: function () {
                var lastWeekDays = [
                    '[pro큄le] [nedjelje] [u] LT',
                    '[pro큄log] [ponedjeljka] [u] LT',
                    '[pro큄log] [utorka] [u] LT',
                    '[pro큄le] [srijede] [u] LT',
                    '[pro큄log] [훾etvrtka] [u] LT',
                    '[pro큄log] [petka] [u] LT',
                    '[pro큄le] [subote] [u] LT',
                ];
                return lastWeekDays[this.day()];
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: 'za %s',
            past: 'prije %s',
            s: 'nekoliko sekundi',
            ss: translator.translate,
            m: translator.translate,
            mm: translator.translate,
            h: translator.translate,
            hh: translator.translate,
            d: 'dan',
            dd: translator.translate,
            M: 'mjesec',
            MM: translator.translate,
            y: 'godinu',
            yy: translator.translate,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('mi', {
        months: 'Kohi-t훮te_Hui-tanguru_Pout큰-te-rangi_Paenga-wh훮wh훮_Haratua_Pipiri_H흲ngoingoi_Here-turi-k흲k훮_Mahuru_Whiringa-훮-nuku_Whiringa-훮-rangi_Hakihea'.split(
            '_'
        ),
        monthsShort: 'Kohi_Hui_Pou_Pae_Hara_Pipi_H흲ngoi_Here_Mahu_Whi-nu_Whi-ra_Haki'.split(
            '_'
        ),
        monthsRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,
        monthsStrictRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,
        monthsShortRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,3}/i,
        monthsShortStrictRegex: /(?:['a-z\u0101\u014D\u016B]+\-?){1,2}/i,
        weekdays: 'R훮tapu_Mane_T큰rei_Wenerei_T훮ite_Paraire_H훮tarei'.split('_'),
        weekdaysShort: 'Ta_Ma_T큰_We_T훮i_Pa_H훮'.split('_'),
        weekdaysMin: 'Ta_Ma_T큰_We_T훮i_Pa_H훮'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY [i] HH:mm',
            LLLL: 'dddd, D MMMM YYYY [i] HH:mm',
        },
        calendar: {
            sameDay: '[i teie mahana, i] LT',
            nextDay: '[apopo i] LT',
            nextWeek: 'dddd [i] LT',
            lastDay: '[inanahi i] LT',
            lastWeek: 'dddd [whakamutunga i] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'i roto i %s',
            past: '%s i mua',
            s: 'te h휆kona ruarua',
            ss: '%d h휆kona',
            m: 'he meneti',
            mm: '%d meneti',
            h: 'te haora',
            hh: '%d haora',
            d: 'he ra',
            dd: '%d ra',
            M: 'he marama',
            MM: '%d marama',
            y: 'he tau',
            yy: '%d tau',
        },
        dayOfMonthOrdinalParse: /\d{1,2}쨘/,
        ordinal: '%d쨘',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('mk', {
        months: '�逵戟�逵�龜_�筠勻��逵�龜_劇逵��_逵極�龜剋_劇逵�_��戟龜_��剋龜_逵勻均���_�筠極�筠劇勻�龜_棘克�棘劇勻�龜_戟棘筠劇勻�龜_畇筠克筠劇勻�龜'.split(
            '_'
        ),
        monthsShort: '�逵戟_�筠勻_劇逵�_逵極�_劇逵�_��戟_��剋_逵勻均_�筠極_棘克�_戟棘筠_畇筠克'.split('_'),
        weekdays: '戟筠畇筠剋逵_極棘戟筠畇筠剋戟龜克_勻�棘�戟龜克_��筠畇逵_�筠�勻��棘克_極筠�棘克_�逵閨棘�逵'.split(
            '_'
        ),
        weekdaysShort: '戟筠畇_極棘戟_勻�棘_��筠_�筠�_極筠�_�逵閨'.split('_'),
        weekdaysMin: '戟e_極o_勻�_��_�筠_極筠_�a'.split('_'),
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'D.MM.YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY H:mm',
            LLLL: 'dddd, D MMMM YYYY H:mm',
        },
        calendar: {
            sameDay: '[�筠戟筠� 勻棘] LT',
            nextDay: '[叫��筠 勻棘] LT',
            nextWeek: '[�棘] dddd [勻棘] LT',
            lastDay: '[��筠�逵 勻棘] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                    case 3:
                    case 6:
                        return '[�鈞劇龜戟逵�逵�逵] dddd [勻棘] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[�鈞劇龜戟逵�龜棘�] dddd [勻棘] LT';
                }
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: '鈞逵 %s',
            past: '極�筠畇 %s',
            s: '戟筠克棘剋克� �筠克�戟畇龜',
            ss: '%d �筠克�戟畇龜',
            m: '筠畇戟逵 劇龜戟��逵',
            mm: '%d 劇龜戟��龜',
            h: '筠畇筠戟 �逵�',
            hh: '%d �逵�逵',
            d: '筠畇筠戟 畇筠戟',
            dd: '%d 畇筠戟逵',
            M: '筠畇筠戟 劇筠�筠�',
            MM: '%d 劇筠�筠�龜',
            y: '筠畇戟逵 均棘畇龜戟逵',
            yy: '%d 均棘畇龜戟龜',
        },
        dayOfMonthOrdinalParse: /\d{1,2}-(筠勻|筠戟|�龜|勻龜|�龜|劇龜)/,
        ordinal: function (number) {
            var lastDigit = number % 10,
                last2Digits = number % 100;
            if (number === 0) {
                return number + '-筠勻';
            } else if (last2Digits === 0) {
                return number + '-筠戟';
            } else if (last2Digits > 10 && last2Digits < 20) {
                return number + '-�龜';
            } else if (lastDigit === 1) {
                return number + '-勻龜';
            } else if (lastDigit === 2) {
                return number + '-�龜';
            } else if (lastDigit === 7 || lastDigit === 8) {
                return number + '-劇龜';
            } else {
                return number + '-�龜';
            }
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('ml', {
        months: '石쒉뇽碩곟뉘石겯늉_石ム탣石о탫石겯탛石듀눗石�_石�늅碩솰킎碩띭킎碩�_石뤲눅碩띭눗石욈돕_石�탥石�탫_石쒉탞碩�_石쒉탞石꿋탦_石볙킋石멘탫石긍탫石긍탫_石멘탣石む탫石긍탫石긍큲石о돔_石믞킉碩띭킓碩뗠눋碩�_石ⓣ뉘石귖눋碩�_石□늉石멘큲石о돔'.split(
            '_'
        ),
        monthsShort: '石쒉뇽碩�._石ム탣石о탫石겯탛._石�늅碩�._石뤲눅碩띭눗石�._石�탥石�탫_石쒉탞碩�_石쒉탞石꿋탦._石볙킋._石멘탣石む탫石긍탫石�._石믞킉碩띭킓碩�._石ⓣ뉘石�._石□늉石멘큲.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: '石왽늅石�눙石약눼碩띭킎_石ㅰ늉石쇸탫石뺖눴石약눼碩띭킎_石싟탨石듀탫石듀늅石닮탫石�_石о탛石㏅뇽石약눼碩띭킎_石듀탫石�늅石닮늅石닮탫石�_石듀탣石녀탫石녀늉石�늅石닮탫石�_石뜩뇽石욈눕石약눼碩띭킎'.split(
            '_'
        ),
        weekdaysShort: '石왽늅石�돔_石ㅰ늉石쇸탫石뺖돗_石싟탨石듀탫石�_石о탛石㏅돐_石듀탫石�늅石닮큲_石듀탣石녀탫石녀늉_石뜩뇽石�'.split('_'),
        weekdaysMin: '石왽늅_石ㅰ늉_石싟탨_石о탛_石듀탫石�늅_石듀탣_石�'.split('_'),
        longDateFormat: {
            LT: 'A h:mm -石ⓣ탛',
            LTS: 'A h:mm:ss -石ⓣ탛',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY, A h:mm -石ⓣ탛',
            LLLL: 'dddd, D MMMM YYYY, A h:mm -石ⓣ탛',
        },
        calendar: {
            sameDay: '[石뉋뇽碩띭뇽碩�] LT',
            nextDay: '[石ⓣ늅石녀탣] LT',
            nextWeek: 'dddd, LT',
            lastDay: '[石뉋뇽碩띭뇽石꿋탣] LT',
            lastWeek: '[石뺖눼石욈킒碩띭킒] dddd, LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s 石뺖눼石욈킒碩띭킒碩�',
            past: '%s 石�탛碩삑눅碩�',
            s: '石끶돕石� 石ⓣ늉石�늉石룅킍碩띭킍碩�',
            ss: '%d 石멘탣石뺖탫石뺖돐石□탫',
            m: '石믞눗碩� 石�늉石ⓣ늉石긍탫石긍탫',
            mm: '%d 石�늉石ⓣ늉石긍탫石긍탫',
            h: '石믞눗碩� 石�뇩石욈킉碩띭킉碩귖돔',
            hh: '%d 石�뇩石욈킉碩띭킉碩귖돔',
            d: '石믞눗碩� 石╆늉石듀뉨石�',
            dd: '%d 石╆늉石듀뉨石�',
            M: '石믞눗碩� 石�늅石멘큲',
            MM: '%d 石�늅石멘큲',
            y: '石믞눗碩� 石듀돔石룅큲',
            yy: '%d 石듀돔石룅큲',
        },
        meridiemParse: /石겯늅石ㅰ탫石겯늉|石겯늅石듀늉石꿋탣|石됢킎碩띭킎 石뺖눼石욈킒碩띭킒碩�|石듀탦石뺖탛石ⓣ탫石ⓣ탥石겯큲|石겯늅石ㅰ탫石겯늉/i,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (
                (meridiem === '石겯늅石ㅰ탫石겯늉' && hour >= 4) ||
                meridiem === '石됢킎碩띭킎 石뺖눼石욈킒碩띭킒碩�' ||
                meridiem === '石듀탦石뺖탛石ⓣ탫石ⓣ탥石겯큲'
            ) {
                return hour + 12;
            } else {
                return hour;
            }
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 4) {
                return '石겯늅石ㅰ탫石겯늉';
            } else if (hour < 12) {
                return '石겯늅石듀늉石꿋탣';
            } else if (hour < 17) {
                return '石됢킎碩띭킎 石뺖눼石욈킒碩띭킒碩�';
            } else if (hour < 20) {
                return '石듀탦石뺖탛石ⓣ탫石ⓣ탥石겯큲';
            } else {
                return '石겯늅石ㅰ탫石겯늉';
            }
        },
    });

    //! moment.js locale configuration

    function translate$7(number, withoutSuffix, key, isFuture) {
        switch (key) {
            case 's':
                return withoutSuffix ? '��畇��戟 �筠克�戟畇' : '��畇��戟 �筠克�戟畇�戟';
            case 'ss':
                return number + (withoutSuffix ? ' �筠克�戟畇' : ' �筠克�戟畇�戟');
            case 'm':
            case 'mm':
                return number + (withoutSuffix ? ' 劇龜戟��' : ' 劇龜戟���戟');
            case 'h':
            case 'hh':
                return number + (withoutSuffix ? ' �逵均' : ' �逵均龜橘戟');
            case 'd':
            case 'dd':
                return number + (withoutSuffix ? ' 旦畇旦�' : ' 旦畇�龜橘戟');
            case 'M':
            case 'MM':
                return number + (withoutSuffix ? ' �逵�' : ' �逵��戟');
            case 'y':
            case 'yy':
                return number + (withoutSuffix ? ' 菌龜剋' : ' 菌龜剋龜橘戟');
            default:
                return number;
        }
    }

    hooks.defineLocale('mn', {
        months: '��均畇奈均��� �逵�_奎棘��畇�均逵逵� �逵�_���逵勻畇�均逵逵� �逵�_�旦�旦勻畇奈均��� �逵�_龜逵勻畇�均逵逵� �逵�_���均逵畇�均逵逵� �逵�_�棘剋畇�均逵逵� �逵�_�逵橘劇畇�均逵逵� �逵�_��畇奈均��� �逵�_��逵勻畇�均逵逵� �逵�_��勻逵戟 戟�均畇奈均��� �逵�_��勻逵戟 �棘��畇�均逵逵� �逵�'.split(
            '_'
        ),
        monthsShort: '1 �逵�_2 �逵�_3 �逵�_4 �逵�_5 �逵�_6 �逵�_7 �逵�_8 �逵�_9 �逵�_10 �逵�_11 �逵�_12 �逵�'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: '��劇_�逵勻逵逵_��均劇逵�_��逵均勻逵_�奈��勻_�逵逵�逵戟_��劇閨逵'.split('_'),
        weekdaysShort: '��劇_�逵勻_��均_��逵_�奈�_�逵逵_��劇'.split('_'),
        weekdaysMin: '��_�逵_��_��_�奈_�逵_��'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'YYYY-MM-DD',
            LL: 'YYYY 棘戟� MMMM�戟 D',
            LLL: 'YYYY 棘戟� MMMM�戟 D HH:mm',
            LLLL: 'dddd, YYYY 棘戟� MMMM�戟 D HH:mm',
        },
        meridiemParse: /內斷|內奎/i,
        isPM: function (input) {
            return input === '內奎';
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 12) {
                return '內斷';
            } else {
                return '內奎';
            }
        },
        calendar: {
            sameDay: '[斷戟旦旦畇旦�] LT',
            nextDay: '[�逵�均逵逵�] LT',
            nextWeek: '[����] dddd LT',
            lastDay: '[斷�龜均畇旦�] LT',
            lastWeek: '[斷戟均旦��旦戟] dddd LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s 畇逵�逵逵',
            past: '%s 旦劇戟旦',
            s: translate$7,
            ss: translate$7,
            m: translate$7,
            mm: translate$7,
            h: translate$7,
            hh: translate$7,
            d: translate$7,
            dd: translate$7,
            M: translate$7,
            MM: translate$7,
            y: translate$7,
            yy: translate$7,
        },
        dayOfMonthOrdinalParse: /\d{1,2} 旦畇旦�/,
        ordinal: function (number, period) {
            switch (period) {
                case 'd':
                case 'D':
                case 'DDD':
                    return number + ' 旦畇旦�';
                default:
                    return number;
            }
        },
    });

    //! moment.js locale configuration

    var symbolMap$c = {
            1: '誓�',
            2: '誓�',
            3: '誓�',
            4: '誓�',
            5: '誓�',
            6: '誓�',
            7: '誓�',
            8: '誓�',
            9: '誓�',
            0: '誓�',
        },
        numberMap$b = {
            '誓�': '1',
            '誓�': '2',
            '誓�': '3',
            '誓�': '4',
            '誓�': '5',
            '誓�': '6',
            '誓�': '7',
            '誓�': '8',
            '誓�': '9',
            '誓�': '0',
        };

    function relativeTimeMr(number, withoutSuffix, string, isFuture) {
        var output = '';
        if (withoutSuffix) {
            switch (string) {
                case 's':
                    output = '西뺖ㅎ西밝� 西멘쪍西뺖쨧西�';
                    break;
                case 'ss':
                    output = '%d 西멘쪍西뺖쨧西�';
                    break;
                case 'm':
                    output = '西뤲쨻 西�ㅏ西ⓣㅏ西�';
                    break;
                case 'mm':
                    output = '%d 西�ㅏ西ⓣㅏ西잀쪍';
                    break;
                case 'h':
                    output = '西뤲쨻 西ㅰㅎ西�';
                    break;
                case 'hh':
                    output = '%d 西ㅰㅎ西�';
                    break;
                case 'd':
                    output = '西뤲쨻 西╆ㅏ西듀ㅈ';
                    break;
                case 'dd':
                    output = '%d 西╆ㅏ西듀ㅈ';
                    break;
                case 'M':
                    output = '西뤲쨻 西�ㅉ西욈ㄸ西�';
                    break;
                case 'MM':
                    output = '%d 西�ㅉ西욈ㄸ誓�';
                    break;
                case 'y':
                    output = '西뤲쨻 西듀ㅀ誓띭ㅇ';
                    break;
                case 'yy':
                    output = '%d 西듀ㅀ誓띭ㅇ誓�';
                    break;
            }
        } else {
            switch (string) {
                case 's':
                    output = '西뺖ㅎ西밝� 西멘쪍西뺖쨧西╆ㅎ西�';
                    break;
                case 'ss':
                    output = '%d 西멘쪍西뺖쨧西╆ㅎ西�';
                    break;
                case 'm':
                    output = '西뤲쨻西� 西�ㅏ西ⓣㅏ西잀ㅎ';
                    break;
                case 'mm':
                    output = '%d 西�ㅏ西ⓣㅏ西잀ㅎ西�';
                    break;
                case 'h':
                    output = '西뤲쨻西� 西ㅰㅎ西멘ㅎ';
                    break;
                case 'hh':
                    output = '%d 西ㅰㅎ西멘ㅎ西�';
                    break;
                case 'd':
                    output = '西뤲쨻西� 西╆ㅏ西듀ㅈ西�';
                    break;
                case 'dd':
                    output = '%d 西╆ㅏ西듀ㅈ西약쨧';
                    break;
                case 'M':
                    output = '西뤲쨻西� 西�ㅉ西욈ㄸ誓띭ㄿ西�';
                    break;
                case 'MM':
                    output = '%d 西�ㅉ西욈ㄸ誓띭ㄿ西약쨧';
                    break;
                case 'y':
                    output = '西뤲쨻西� 西듀ㅀ誓띭ㅇ西�';
                    break;
                case 'yy':
                    output = '%d 西듀ㅀ誓띭ㅇ西약쨧';
                    break;
            }
        }
        return output.replace(/%d/i, number);
    }

    hooks.defineLocale('mr', {
        months: '西쒉ㅎ西ⓣ쪍西듀ㅎ西겯�_西ム쪍西о쪓西겯쪇西듀ㅎ西겯�_西�ㅎ西겯쪓西�_西뤲ㄺ誓띭ㅀ西욈ㅂ_西�쪍_西쒉쪈西�_西쒉쪇西꿋쪎_西묂쨽西멘쪓西�_西멘ㄺ誓띭쩅誓뉋쨧西оㅀ_西묂쨻誓띭쩅誓뗠ㄼ西�_西ⓣ쪑西듀쪓西밝쪍西귖ㄼ西�_西□ㅏ西멘쪍西귖ㄼ西�'.split(
            '_'
        ),
        monthsShort: '西쒉ㅎ西ⓣ쪍._西ム쪍西о쪓西겯쪇._西�ㅎ西겯쪓西�._西뤲ㄺ誓띭ㅀ西�._西�쪍._西쒉쪈西�._西쒉쪇西꿋쪎._西묂쨽._西멘ㄺ誓띭쩅誓뉋쨧._西묂쨻誓띭쩅誓�._西ⓣ쪑西듀쪓西밝쪍西�._西□ㅏ西멘쪍西�.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: '西겯ㅅ西욈ㅅ西약ㅀ_西멘쪑西�ㅅ西약ㅀ_西�쨧西쀠ㅃ西듀ㅎ西�_西о쪇西㏅ㅅ西약ㅀ_西쀠쪇西겯쪈西듀ㅎ西�_西뜩쪇西뺖쪓西겯ㅅ西약ㅀ_西뜩ㄸ西욈ㅅ西약ㅀ'.split('_'),
        weekdaysShort: '西겯ㅅ西�_西멘쪑西�_西�쨧西쀠ㅃ_西о쪇西�_西쀠쪇西겯쪈_西뜩쪇西뺖쪓西�_西뜩ㄸ西�'.split('_'),
        weekdaysMin: '西�_西멘쪑_西�쨧_西о쪇_西쀠쪇_西뜩쪇_西�'.split('_'),
        longDateFormat: {
            LT: 'A h:mm 西듀ㅎ西쒉ㄴ西�',
            LTS: 'A h:mm:ss 西듀ㅎ西쒉ㄴ西�',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY, A h:mm 西듀ㅎ西쒉ㄴ西�',
            LLLL: 'dddd, D MMMM YYYY, A h:mm 西듀ㅎ西쒉ㄴ西�',
        },
        calendar: {
            sameDay: '[西녱쩂] LT',
            nextDay: '[西됢ㄶ誓띭ㄿ西�] LT',
            nextWeek: 'dddd, LT',
            lastDay: '[西뺖ㅎ西�] LT',
            lastWeek: '[西�ㅎ西쀠�西�] dddd, LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s西�ㄷ誓띭ㄿ誓�',
            past: '%s西む쪈西겯쪓西듀�',
            s: relativeTimeMr,
            ss: relativeTimeMr,
            m: relativeTimeMr,
            mm: relativeTimeMr,
            h: relativeTimeMr,
            hh: relativeTimeMr,
            d: relativeTimeMr,
            dd: relativeTimeMr,
            M: relativeTimeMr,
            MM: relativeTimeMr,
            y: relativeTimeMr,
            yy: relativeTimeMr,
        },
        preparse: function (string) {
            return string.replace(/[誓㏅ⅷ誓⒯ⅹ誓ム�誓��誓�ⅵ]/g, function (match) {
                return numberMap$b[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap$c[match];
            });
        },
        meridiemParse: /西むㅉ西약쩅誓�|西멘쨻西약ㅃ誓�|西╆쪇西むㅎ西겯�|西멘ㅎ西�쨧西뺖ㅎ西녀�|西겯ㅎ西ㅰ쪓西겯�/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '西むㅉ西약쩅誓�' || meridiem === '西멘쨻西약ㅃ誓�') {
                return hour;
            } else if (
                meridiem === '西╆쪇西むㅎ西겯�' ||
                meridiem === '西멘ㅎ西�쨧西뺖ㅎ西녀�' ||
                meridiem === '西겯ㅎ西ㅰ쪓西겯�'
            ) {
                return hour >= 12 ? hour : hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            if (hour >= 0 && hour < 6) {
                return '西むㅉ西약쩅誓�';
            } else if (hour < 12) {
                return '西멘쨻西약ㅃ誓�';
            } else if (hour < 17) {
                return '西╆쪇西むㅎ西겯�';
            } else if (hour < 20) {
                return '西멘ㅎ西�쨧西뺖ㅎ西녀�';
            } else {
                return '西겯ㅎ西ㅰ쪓西겯�';
            }
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 6, // The week that contains Jan 6th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('ms-my', {
        months: 'Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember'.split(
            '_'
        ),
        monthsShort: 'Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis'.split('_'),
        weekdays: 'Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu'.split('_'),
        weekdaysShort: 'Ahd_Isn_Sel_Rab_Kha_Jum_Sab'.split('_'),
        weekdaysMin: 'Ah_Is_Sl_Rb_Km_Jm_Sb'.split('_'),
        longDateFormat: {
            LT: 'HH.mm',
            LTS: 'HH.mm.ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY [pukul] HH.mm',
            LLLL: 'dddd, D MMMM YYYY [pukul] HH.mm',
        },
        meridiemParse: /pagi|tengahari|petang|malam/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'pagi') {
                return hour;
            } else if (meridiem === 'tengahari') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === 'petang' || meridiem === 'malam') {
                return hour + 12;
            }
        },
        meridiem: function (hours, minutes, isLower) {
            if (hours < 11) {
                return 'pagi';
            } else if (hours < 15) {
                return 'tengahari';
            } else if (hours < 19) {
                return 'petang';
            } else {
                return 'malam';
            }
        },
        calendar: {
            sameDay: '[Hari ini pukul] LT',
            nextDay: '[Esok pukul] LT',
            nextWeek: 'dddd [pukul] LT',
            lastDay: '[Kelmarin pukul] LT',
            lastWeek: 'dddd [lepas pukul] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'dalam %s',
            past: '%s yang lepas',
            s: 'beberapa saat',
            ss: '%d saat',
            m: 'seminit',
            mm: '%d minit',
            h: 'sejam',
            hh: '%d jam',
            d: 'sehari',
            dd: '%d hari',
            M: 'sebulan',
            MM: '%d bulan',
            y: 'setahun',
            yy: '%d tahun',
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('ms', {
        months: 'Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember'.split(
            '_'
        ),
        monthsShort: 'Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis'.split('_'),
        weekdays: 'Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu'.split('_'),
        weekdaysShort: 'Ahd_Isn_Sel_Rab_Kha_Jum_Sab'.split('_'),
        weekdaysMin: 'Ah_Is_Sl_Rb_Km_Jm_Sb'.split('_'),
        longDateFormat: {
            LT: 'HH.mm',
            LTS: 'HH.mm.ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY [pukul] HH.mm',
            LLLL: 'dddd, D MMMM YYYY [pukul] HH.mm',
        },
        meridiemParse: /pagi|tengahari|petang|malam/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'pagi') {
                return hour;
            } else if (meridiem === 'tengahari') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === 'petang' || meridiem === 'malam') {
                return hour + 12;
            }
        },
        meridiem: function (hours, minutes, isLower) {
            if (hours < 11) {
                return 'pagi';
            } else if (hours < 15) {
                return 'tengahari';
            } else if (hours < 19) {
                return 'petang';
            } else {
                return 'malam';
            }
        },
        calendar: {
            sameDay: '[Hari ini pukul] LT',
            nextDay: '[Esok pukul] LT',
            nextWeek: 'dddd [pukul] LT',
            lastDay: '[Kelmarin pukul] LT',
            lastWeek: 'dddd [lepas pukul] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'dalam %s',
            past: '%s yang lepas',
            s: 'beberapa saat',
            ss: '%d saat',
            m: 'seminit',
            mm: '%d minit',
            h: 'sejam',
            hh: '%d jam',
            d: 'sehari',
            dd: '%d hari',
            M: 'sebulan',
            MM: '%d bulan',
            y: 'setahun',
            yy: '%d tahun',
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('mt', {
        months: 'Jannar_Frar_Marzu_April_Mejju_휔unju_Lulju_Awwissu_Settembru_Ottubru_Novembru_Di훺embru'.split(
            '_'
        ),
        monthsShort: 'Jan_Fra_Mar_Apr_Mej_휔un_Lul_Aww_Set_Ott_Nov_Di훺'.split('_'),
        weekdays: 'Il-칡add_It-Tnejn_It-Tlieta_L-Erbg침a_Il-칡amis_Il-휔img침a_Is-Sibt'.split(
            '_'
        ),
        weekdaysShort: '칡ad_Tne_Tli_Erb_칡am_휔im_Sib'.split('_'),
        weekdaysMin: '칡a_Tn_Tl_Er_칡a_휔i_Si'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Illum fil-]LT',
            nextDay: '[G침ada fil-]LT',
            nextWeek: 'dddd [fil-]LT',
            lastDay: '[Il-biera침 fil-]LT',
            lastWeek: 'dddd [li g침adda] [fil-]LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'f�� %s',
            past: '%s ilu',
            s: 'ftit sekondi',
            ss: '%d sekondi',
            m: 'minuta',
            mm: '%d minuti',
            h: 'sieg침a',
            hh: '%d sieg침at',
            d: '치urnata',
            dd: '%d 치ranet',
            M: 'xahar',
            MM: '%d xhur',
            y: 'sena',
            yy: '%d sni',
        },
        dayOfMonthOrdinalParse: /\d{1,2}쨘/,
        ordinal: '%d쨘',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var symbolMap$d = {
            1: '��',
            2: '��',
            3: '��',
            4: '��',
            5: '��',
            6: '��',
            7: '��',
            8: '��',
            9: '��',
            0: '��',
        },
        numberMap$c = {
            '��': '1',
            '��': '2',
            '��': '3',
            '��': '4',
            '��': '5',
            '��': '6',
            '��': '7',
            '��': '8',
            '��': '9',
            '��': '0',
        };

    hooks.defineLocale('my', {
        months: '�뉌�붳�뷘�붳�앩�メ�쎺��_�뽥�긔�뽥�긔�п�뷘�앩�メ�쎺��_�쇹�먤��_�㎭�뺗�솽��_�쇹��_�뉌�써�붳��_�뉌�결�쒊�����꾞��_�왾�솽�귗���먤��_�끷���뷘�먤�꾞�뷘�섂��_�■�긔�п���뷘�먤�����섂��_�붳�����앩�꾞�뷘�섂��_�믟���뉌�꾞�뷘�섂��'.split(
            '_'
        ),
        monthsShort: '�뉌�붳��_�뽥��_�쇹�먤��_�뺗�솽��_�쇹��_�뉌�써�붳��_�쒊�����꾞��_�왾��_�끷����_�■�긔�п����_�붳����_�믟��'.split('_'),
        weekdays: '�먤�붳�꾞�뷘�밞�귗�붳�써��_�먤�붳�꾞�뷘�밞�쒊��_�■�꾞�뷘�밞�귗��_�쀡���믟�밞�볚�잁�결��_���솽�п�왾�뺗�먤�긔��_�왾�긔�п���솽��_�끷�붳��'.split(
            '_'
        ),
        weekdaysShort: '�붳�써��_�쒊��_�귗��_�잁�결��_���솽��_�왾�긔��_�붳��'.split('_'),
        weekdaysMin: '�붳�써��_�쒊��_�귗��_�잁�결��_���솽��_�왾�긔��_�붳��'.split('_'),

        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[�싡�붳��.] LT [�쇹�얀��]',
            nextDay: '[�쇹�붳���뷘�뽥�솽�붳��] LT [�쇹�얀��]',
            nextWeek: 'dddd LT [�쇹�얀��]',
            lastDay: '[�쇹�붳��.��] LT [�쇹�얀��]',
            lastWeek: '[�뺗�솽���멜�곢�꿍�료�왾�긔��] dddd LT [�쇹�얀��]',
            sameElse: 'L',
        },
        relativeTime: {
            future: '�쒊�п�쇹�듻�뷘�� %s �쇹�얀��',
            past: '�쒊�써�붳�뷘�곢�꿍�료�왾�긔�� %s ��',
            s: '�끷���밞���붳��.�■�붳�듻�뷘�멜�꾞�싡��',
            ss: '%d �끷���밞���붳�료��',
            m: '�먤�끷�뷘�쇹���붳�끷��',
            mm: '%d �쇹���붳�끷��',
            h: '�먤�끷�뷘�붳�п�쎺��',
            hh: '%d �붳�п�쎺��',
            d: '�먤�끷�뷘�쎺����',
            dd: '%d �쎺����',
            M: '�먤�끷�뷘��',
            MM: '%d ��',
            y: '�먤�끷�뷘�붳�얀�끷��',
            yy: '%d �붳�얀�끷��',
        },
        preparse: function (string) {
            return string.replace(/[�곢걗�꺻걚�끷걝�뉌걟�됣�]/g, function (match) {
                return numberMap$c[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap$d[match];
            });
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('nb', {
        months: 'januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember'.split(
            '_'
        ),
        monthsShort: 'jan._feb._mars_apr._mai_juni_juli_aug._sep._okt._nov._des.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 's첩ndag_mandag_tirsdag_onsdag_torsdag_fredag_l첩rdag'.split('_'),
        weekdaysShort: 's첩._ma._ti._on._to._fr._l첩.'.split('_'),
        weekdaysMin: 's첩_ma_ti_on_to_fr_l첩'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY [kl.] HH:mm',
            LLLL: 'dddd D. MMMM YYYY [kl.] HH:mm',
        },
        calendar: {
            sameDay: '[i dag kl.] LT',
            nextDay: '[i morgen kl.] LT',
            nextWeek: 'dddd [kl.] LT',
            lastDay: '[i g책r kl.] LT',
            lastWeek: '[forrige] dddd [kl.] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'om %s',
            past: '%s siden',
            s: 'noen sekunder',
            ss: '%d sekunder',
            m: 'ett minutt',
            mm: '%d minutter',
            h: 'en time',
            hh: '%d timer',
            d: 'en dag',
            dd: '%d dager',
            w: 'en uke',
            ww: '%d uker',
            M: 'en m책ned',
            MM: '%d m책neder',
            y: 'ett 책r',
            yy: '%d 책r',
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var symbolMap$e = {
            1: '誓�',
            2: '誓�',
            3: '誓�',
            4: '誓�',
            5: '誓�',
            6: '誓�',
            7: '誓�',
            8: '誓�',
            9: '誓�',
            0: '誓�',
        },
        numberMap$d = {
            '誓�': '1',
            '誓�': '2',
            '誓�': '3',
            '誓�': '4',
            '誓�': '5',
            '誓�': '6',
            '誓�': '7',
            '誓�': '8',
            '誓�': '9',
            '誓�': '0',
        };

    hooks.defineLocale('ne', {
        months: '西쒉ㄸ西듀ㅀ誓�_西ム쪍西о쪓西겯쪇西듀ㅀ誓�_西�ㅎ西겯쪓西�_西끶ㄺ誓띭ㅀ西욈ㅂ_西�쨮_西쒉쪇西�_西쒉쪇西꿋ㅎ西�_西끶쨽西룅쪓西�_西멘쪍西む쪓西잀쪍西�쪓西оㅀ_西끶쨻誓띭쩅誓뗠ㄼ西�_西ⓣ쪑西�쪍西�쪓西оㅀ_西□ㅏ西멘쪍西�쪓西оㅀ'.split(
            '_'
        ),
        monthsShort: '西쒉ㄸ._西ム쪍西о쪓西겯쪇._西�ㅎ西겯쪓西�_西끶ㄺ誓띭ㅀ西�._西�쨮_西쒉쪇西�_西쒉쪇西꿋ㅎ西�._西끶쨽._西멘쪍西む쪓西�._西끶쨻誓띭쩅誓�._西ⓣ쪑西�쪍._西□ㅏ西멘쪍.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: '西녱쨭西ㅰㄼ西약ㅀ_西멘쪑西�ㄼ西약ㅀ_西�쨿誓띭쨽西꿋ㄼ西약ㅀ_西о쪇西㏅ㄼ西약ㅀ_西оㅏ西밝ㅏ西оㅎ西�_西뜩쪇西뺖쪓西겯ㄼ西약ㅀ_西뜩ㄸ西욈ㄼ西약ㅀ'.split(
            '_'
        ),
        weekdaysShort: '西녱쨭西�._西멘쪑西�._西�쨿誓띭쨽西�._西о쪇西�._西оㅏ西밝ㅏ._西뜩쪇西뺖쪓西�._西뜩ㄸ西�.'.split('_'),
        weekdaysMin: '西�._西멘쪑._西�쨧._西о쪇._西оㅏ._西뜩쪇._西�.'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'A西뺖쪑 h:mm 西о쩂誓�',
            LTS: 'A西뺖쪑 h:mm:ss 西о쩂誓�',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY, A西뺖쪑 h:mm 西о쩂誓�',
            LLLL: 'dddd, D MMMM YYYY, A西뺖쪑 h:mm 西о쩂誓�',
        },
        preparse: function (string) {
            return string.replace(/[誓㏅ⅷ誓⒯ⅹ誓ム�誓��誓�ⅵ]/g, function (match) {
                return numberMap$d[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap$e[match];
            });
        },
        meridiemParse: /西겯ㅎ西ㅰㅏ|西оㅏ西밝ㅎ西�|西╆ㅏ西됢쨦西멘쪑|西멘ㅎ西곟쩃/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '西겯ㅎ西ㅰㅏ') {
                return hour < 4 ? hour : hour + 12;
            } else if (meridiem === '西оㅏ西밝ㅎ西�') {
                return hour;
            } else if (meridiem === '西╆ㅏ西됢쨦西멘쪑') {
                return hour >= 10 ? hour : hour + 12;
            } else if (meridiem === '西멘ㅎ西곟쩃') {
                return hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 3) {
                return '西겯ㅎ西ㅰㅏ';
            } else if (hour < 12) {
                return '西оㅏ西밝ㅎ西�';
            } else if (hour < 16) {
                return '西╆ㅏ西됢쨦西멘쪑';
            } else if (hour < 20) {
                return '西멘ㅎ西곟쩃';
            } else {
                return '西겯ㅎ西ㅰㅏ';
            }
        },
        calendar: {
            sameDay: '[西녱쩂] LT',
            nextDay: '[西�쪑西꿋ㅏ] LT',
            nextWeek: '[西녱쨯西곟ㄶ誓�] dddd[,] LT',
            lastDay: '[西밝ㅏ西쒉쪑] LT',
            lastWeek: '[西쀠쨵西뺖쪑] dddd[,] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s西�ㅎ',
            past: '%s 西끶쨽西약ㄱ西�',
            s: '西뺖쪍西밝� 西뺖쪓西룅ㄳ',
            ss: '%d 西멘쪍西뺖쪍西｀쪓西�',
            m: '西뤲쨻 西�ㅏ西ⓣ쪍西�',
            mm: '%d 西�ㅏ西ⓣ쪍西�',
            h: '西뤲쨻 西섁ㄳ誓띭쩅西�',
            hh: '%d 西섁ㄳ誓띭쩅西�',
            d: '西뤲쨻 西╆ㅏ西�',
            dd: '%d 西╆ㅏ西�',
            M: '西뤲쨻 西�ㅉ西욈ㄸ西�',
            MM: '%d 西�ㅉ西욈ㄸ西�',
            y: '西뤲쨻 西оㅀ誓띭ㅇ',
            yy: '%d 西оㅀ誓띭ㅇ',
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 6, // The week that contains Jan 6th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var monthsShortWithDots$1 = 'jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.'.split(
            '_'
        ),
        monthsShortWithoutDots$1 = 'jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec'.split(
            '_'
        ),
        monthsParse$8 = [
            /^jan/i,
            /^feb/i,
            /^maart|mrt.?$/i,
            /^apr/i,
            /^mei$/i,
            /^jun[i.]?$/i,
            /^jul[i.]?$/i,
            /^aug/i,
            /^sep/i,
            /^okt/i,
            /^nov/i,
            /^dec/i,
        ],
        monthsRegex$8 = /^(januari|februari|maart|april|mei|ju[nl]i|augustus|september|oktober|november|december|jan\.?|feb\.?|mrt\.?|apr\.?|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i;

    hooks.defineLocale('nl-be', {
        months: 'januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december'.split(
            '_'
        ),
        monthsShort: function (m, format) {
            if (!m) {
                return monthsShortWithDots$1;
            } else if (/-MMM-/.test(format)) {
                return monthsShortWithoutDots$1[m.month()];
            } else {
                return monthsShortWithDots$1[m.month()];
            }
        },

        monthsRegex: monthsRegex$8,
        monthsShortRegex: monthsRegex$8,
        monthsStrictRegex: /^(januari|februari|maart|april|mei|ju[nl]i|augustus|september|oktober|november|december)/i,
        monthsShortStrictRegex: /^(jan\.?|feb\.?|mrt\.?|apr\.?|mei|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i,

        monthsParse: monthsParse$8,
        longMonthsParse: monthsParse$8,
        shortMonthsParse: monthsParse$8,

        weekdays: 'zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag'.split(
            '_'
        ),
        weekdaysShort: 'zo._ma._di._wo._do._vr._za.'.split('_'),
        weekdaysMin: 'zo_ma_di_wo_do_vr_za'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[vandaag om] LT',
            nextDay: '[morgen om] LT',
            nextWeek: 'dddd [om] LT',
            lastDay: '[gisteren om] LT',
            lastWeek: '[afgelopen] dddd [om] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'over %s',
            past: '%s geleden',
            s: 'een paar seconden',
            ss: '%d seconden',
            m: '챕챕n minuut',
            mm: '%d minuten',
            h: '챕챕n uur',
            hh: '%d uur',
            d: '챕챕n dag',
            dd: '%d dagen',
            M: '챕챕n maand',
            MM: '%d maanden',
            y: '챕챕n jaar',
            yy: '%d jaar',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(ste|de)/,
        ordinal: function (number) {
            return (
                number +
                (number === 1 || number === 8 || number >= 20 ? 'ste' : 'de')
            );
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var monthsShortWithDots$2 = 'jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.'.split(
            '_'
        ),
        monthsShortWithoutDots$2 = 'jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec'.split(
            '_'
        ),
        monthsParse$9 = [
            /^jan/i,
            /^feb/i,
            /^maart|mrt.?$/i,
            /^apr/i,
            /^mei$/i,
            /^jun[i.]?$/i,
            /^jul[i.]?$/i,
            /^aug/i,
            /^sep/i,
            /^okt/i,
            /^nov/i,
            /^dec/i,
        ],
        monthsRegex$9 = /^(januari|februari|maart|april|mei|ju[nl]i|augustus|september|oktober|november|december|jan\.?|feb\.?|mrt\.?|apr\.?|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i;

    hooks.defineLocale('nl', {
        months: 'januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december'.split(
            '_'
        ),
        monthsShort: function (m, format) {
            if (!m) {
                return monthsShortWithDots$2;
            } else if (/-MMM-/.test(format)) {
                return monthsShortWithoutDots$2[m.month()];
            } else {
                return monthsShortWithDots$2[m.month()];
            }
        },

        monthsRegex: monthsRegex$9,
        monthsShortRegex: monthsRegex$9,
        monthsStrictRegex: /^(januari|februari|maart|april|mei|ju[nl]i|augustus|september|oktober|november|december)/i,
        monthsShortStrictRegex: /^(jan\.?|feb\.?|mrt\.?|apr\.?|mei|ju[nl]\.?|aug\.?|sep\.?|okt\.?|nov\.?|dec\.?)/i,

        monthsParse: monthsParse$9,
        longMonthsParse: monthsParse$9,
        shortMonthsParse: monthsParse$9,

        weekdays: 'zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag'.split(
            '_'
        ),
        weekdaysShort: 'zo._ma._di._wo._do._vr._za.'.split('_'),
        weekdaysMin: 'zo_ma_di_wo_do_vr_za'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD-MM-YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[vandaag om] LT',
            nextDay: '[morgen om] LT',
            nextWeek: 'dddd [om] LT',
            lastDay: '[gisteren om] LT',
            lastWeek: '[afgelopen] dddd [om] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'over %s',
            past: '%s geleden',
            s: 'een paar seconden',
            ss: '%d seconden',
            m: '챕챕n minuut',
            mm: '%d minuten',
            h: '챕챕n uur',
            hh: '%d uur',
            d: '챕챕n dag',
            dd: '%d dagen',
            w: '챕챕n week',
            ww: '%d weken',
            M: '챕챕n maand',
            MM: '%d maanden',
            y: '챕챕n jaar',
            yy: '%d jaar',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(ste|de)/,
        ordinal: function (number) {
            return (
                number +
                (number === 1 || number === 8 || number >= 20 ? 'ste' : 'de')
            );
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('nn', {
        months: 'januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember'.split(
            '_'
        ),
        monthsShort: 'jan._feb._mars_apr._mai_juni_juli_aug._sep._okt._nov._des.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'sundag_m책ndag_tysdag_onsdag_torsdag_fredag_laurdag'.split('_'),
        weekdaysShort: 'su._m책._ty._on._to._fr._lau.'.split('_'),
        weekdaysMin: 'su_m책_ty_on_to_fr_la'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY [kl.] H:mm',
            LLLL: 'dddd D. MMMM YYYY [kl.] HH:mm',
        },
        calendar: {
            sameDay: '[I dag klokka] LT',
            nextDay: '[I morgon klokka] LT',
            nextWeek: 'dddd [klokka] LT',
            lastDay: '[I g책r klokka] LT',
            lastWeek: '[F첩reg책ande] dddd [klokka] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'om %s',
            past: '%s sidan',
            s: 'nokre sekund',
            ss: '%d sekund',
            m: 'eit minutt',
            mm: '%d minutt',
            h: 'ein time',
            hh: '%d timar',
            d: 'ein dag',
            dd: '%d dagar',
            w: 'ei veke',
            ww: '%d veker',
            M: 'ein m책nad',
            MM: '%d m책nader',
            y: 'eit 책r',
            yy: '%d 책r',
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('oc-lnc', {
        months: {
            standalone: 'geni챔r_febri챔r_mar챌_abril_mai_junh_julhet_agost_setembre_oct챵bre_novembre_decembre'.split(
                '_'
            ),
            format: "de geni챔r_de febri챔r_de mar챌_d'abril_de mai_de junh_de julhet_d'agost_de setembre_d'oct챵bre_de novembre_de decembre".split(
                '_'
            ),
            isFormat: /D[oD]?(\s)+MMMM/,
        },
        monthsShort: 'gen._febr._mar챌_abr._mai_junh_julh._ago._set._oct._nov._dec.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'dimenge_diluns_dimars_dim챔cres_dij챵us_divendres_dissabte'.split(
            '_'
        ),
        weekdaysShort: 'dg._dl._dm._dc._dj._dv._ds.'.split('_'),
        weekdaysMin: 'dg_dl_dm_dc_dj_dv_ds'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM [de] YYYY',
            ll: 'D MMM YYYY',
            LLL: 'D MMMM [de] YYYY [a] H:mm',
            lll: 'D MMM YYYY, H:mm',
            LLLL: 'dddd D MMMM [de] YYYY [a] H:mm',
            llll: 'ddd D MMM YYYY, H:mm',
        },
        calendar: {
            sameDay: '[u챔i a] LT',
            nextDay: '[deman a] LT',
            nextWeek: 'dddd [a] LT',
            lastDay: '[i챔r a] LT',
            lastWeek: 'dddd [passat a] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: "d'aqu챠 %s",
            past: 'fa %s',
            s: 'unas segondas',
            ss: '%d segondas',
            m: 'una minuta',
            mm: '%d minutas',
            h: 'una ora',
            hh: '%d oras',
            d: 'un jorn',
            dd: '%d jorns',
            M: 'un mes',
            MM: '%d meses',
            y: 'un an',
            yy: '%d ans',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(r|n|t|챔|a)/,
        ordinal: function (number, period) {
            var output =
                number === 1
                    ? 'r'
                    : number === 2
                        ? 'n'
                        : number === 3
                            ? 'r'
                            : number === 4
                                ? 't'
                                : '챔';
            if (period === 'w' || period === 'W') {
                output = 'a';
            }
            return number + output;
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4,
        },
    });

    //! moment.js locale configuration

    var symbolMap$f = {
            1: '鼠�',
            2: '鼠�',
            3: '鼠�',
            4: '鼠�',
            5: '鼠�',
            6: '鼠�',
            7: '鼠�',
            8: '鼠�',
            9: '鼠�',
            0: '鼠�',
        },
        numberMap$e = {
            '鼠�': '1',
            '鼠�': '2',
            '鼠�': '3',
            '鼠�': '4',
            '鼠�': '5',
            '鼠�': '6',
            '鼠�': '7',
            '鼠�': '8',
            '鼠�': '9',
            '鼠�': '0',
        };

    hooks.defineLocale('pa-in', {
        // There are months name as per Nanakshahi Calendar but they are not used as rigidly in modern Punjabi.
        months: '黍쒉Ŀ黍듀�鼠�_黍ム㉫黍겯㉤黍겯�_黍�㉭黍겯쮾_黍끶Ø鼠띭�鼠댽㉡_黍�쮫_黍쒉쯾黍�_黍쒉쯽黍꿋㉭黍�_黍끶쮻黍멘Ħ_黍멘Ħ鼠겯º黍�_黍끶쮹黍ㅰ쯾黍о�_黍ⓣ㉤鼠겯º黍�_黍╆㉧鼠겯º黍�'.split(
            '_'
        ),
        monthsShort: '黍쒉Ŀ黍듀�鼠�_黍ム㉫黍겯㉤黍겯�_黍�㉭黍겯쮾_黍끶Ø鼠띭�鼠댽㉡_黍�쮫_黍쒉쯾黍�_黍쒉쯽黍꿋㉭黍�_黍끶쮻黍멘Ħ_黍멘Ħ鼠겯º黍�_黍끶쮹黍ㅰ쯾黍о�_黍ⓣ㉤鼠겯º黍�_黍╆㉧鼠겯º黍�'.split(
            '_'
        ),
        weekdays: '黍먣Ħ黍듀㉭黍�_黍멘찇黍�㉤黍약�_黍�ŉ黍쀠㉡黍듀㉭黍�_黍о쯽黍㏅㉤黍약�_黍듀�黍겯㉤黍약�_黍멘㉫鼠곟㈀黍뺖�黍듀㉭黍�_黍멘㉫黍ⓣ�黍싟�黍듀㉭黍�'.split(
            '_'
        ),
        weekdaysShort: '黍먣Ħ_黍멘찇黍�_黍�ŉ黍쀠㉡_黍о쯽黍�_黍듀�黍�_黍멘㉫鼠곟쮹黍�_黍멘㉫黍ⓣ�'.split('_'),
        weekdaysMin: '黍먣Ħ_黍멘찇黍�_黍�ŉ黍쀠㉡_黍о쯽黍�_黍듀�黍�_黍멘㉫鼠곟쮹黍�_黍멘㉫黍ⓣ�'.split('_'),
        longDateFormat: {
            LT: 'A h:mm 黍듀쯀鼠�',
            LTS: 'A h:mm:ss 黍듀쯀鼠�',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY, A h:mm 黍듀쯀鼠�',
            LLLL: 'dddd, D MMMM YYYY, A h:mm 黍듀쯀鼠�',
        },
        calendar: {
            sameDay: '[黍끶쯀] LT',
            nextDay: '[黍뺖㉡] LT',
            nextWeek: '[黍끶쮻黍꿋㉭] dddd, LT',
            lastDay: '[黍뺖㉡] LT',
            lastWeek: '[黍む㉮黍쎹㉡鼠�] dddd, LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s 黍듀㉮鼠긍쮾',
            past: '%s 黍む㉮黍쎹㉡鼠�',
            s: '黍뺖쯽黍� 黍멘쮹黍욈ŉ黍�',
            ss: '%d 黍멘쮹黍욈ŉ黍�',
            m: '黍뉋쮹 黍�㉮鼠겯쯃',
            mm: '%d 黍�㉮鼠겯쯃',
            h: '黍뉋㈀黍� 黍섁ŉ黍잀㉭',
            hh: '%d 黍섁ŉ黍잀찃',
            d: '黍뉋㈀黍� 黍╆㉮黍�',
            dd: '%d 黍╆㉮黍�',
            M: '黍뉋㈀黍� 黍�㉨鼠�黍ⓣ㉭',
            MM: '%d 黍�㉨鼠�黍ⓣ찃',
            y: '黍뉋㈀黍� 黍멘㉭黍�',
            yy: '%d 黍멘㉭黍�',
        },
        preparse: function (string) {
            return string.replace(/[鼠㏅ŀ鼠⒯ø鼠ムß鼠�ŧ鼠�ĳ]/g, function (match) {
                return numberMap$e[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap$f[match];
            });
        },
        // Punjabi notation for meridiems are quite fuzzy in practice. While there exists
        // a rigid notion of a 'Pahar' it is not used as rigidly in modern Punjabi.
        meridiemParse: /黍겯㉭黍�|黍멘㉤鼠뉋�|黍╆쯽黍む㉨黍욈�|黍멘㉫黍약Ŧ/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '黍겯㉭黍�') {
                return hour < 4 ? hour : hour + 12;
            } else if (meridiem === '黍멘㉤鼠뉋�') {
                return hour;
            } else if (meridiem === '黍╆쯽黍む㉨黍욈�') {
                return hour >= 10 ? hour : hour + 12;
            } else if (meridiem === '黍멘㉫黍약Ŧ') {
                return hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 4) {
                return '黍겯㉭黍�';
            } else if (hour < 10) {
                return '黍멘㉤鼠뉋�';
            } else if (hour < 17) {
                return '黍╆쯽黍む㉨黍욈�';
            } else if (hour < 20) {
                return '黍멘㉫黍약Ŧ';
            } else {
                return '黍겯㉭黍�';
            }
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 6, // The week that contains Jan 6th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var monthsNominative = 'stycze흦_luty_marzec_kwiecie흦_maj_czerwiec_lipiec_sierpie흦_wrzesie흦_pa탄dziernik_listopad_grudzie흦'.split(
            '_'
        ),
        monthsSubjective = 'stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_wrze힄nia_pa탄dziernika_listopada_grudnia'.split(
            '_'
        ),
        monthsParse$a = [
            /^sty/i,
            /^lut/i,
            /^mar/i,
            /^kwi/i,
            /^maj/i,
            /^cze/i,
            /^lip/i,
            /^sie/i,
            /^wrz/i,
            /^pa탄/i,
            /^lis/i,
            /^gru/i,
        ];
    function plural$3(n) {
        return n % 10 < 5 && n % 10 > 1 && ~~(n / 10) % 10 !== 1;
    }
    function translate$8(number, withoutSuffix, key) {
        var result = number + ' ';
        switch (key) {
            case 'ss':
                return result + (plural$3(number) ? 'sekundy' : 'sekund');
            case 'm':
                return withoutSuffix ? 'minuta' : 'minut휌';
            case 'mm':
                return result + (plural$3(number) ? 'minuty' : 'minut');
            case 'h':
                return withoutSuffix ? 'godzina' : 'godzin휌';
            case 'hh':
                return result + (plural$3(number) ? 'godziny' : 'godzin');
            case 'ww':
                return result + (plural$3(number) ? 'tygodnie' : 'tygodni');
            case 'MM':
                return result + (plural$3(number) ? 'miesi훳ce' : 'miesi휌cy');
            case 'yy':
                return result + (plural$3(number) ? 'lata' : 'lat');
        }
    }

    hooks.defineLocale('pl', {
        months: function (momentToFormat, format) {
            if (!momentToFormat) {
                return monthsNominative;
            } else if (/D MMMM/.test(format)) {
                return monthsSubjective[momentToFormat.month()];
            } else {
                return monthsNominative[momentToFormat.month()];
            }
        },
        monthsShort: 'sty_lut_mar_kwi_maj_cze_lip_sie_wrz_pa탄_lis_gru'.split('_'),
        monthsParse: monthsParse$a,
        longMonthsParse: monthsParse$a,
        shortMonthsParse: monthsParse$a,
        weekdays: 'niedziela_poniedzia흢ek_wtorek_힄roda_czwartek_pi훳tek_sobota'.split(
            '_'
        ),
        weekdaysShort: 'ndz_pon_wt_힄r_czw_pt_sob'.split('_'),
        weekdaysMin: 'Nd_Pn_Wt_힃r_Cz_Pt_So'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Dzi힄 o] LT',
            nextDay: '[Jutro o] LT',
            nextWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[W niedziel휌 o] LT';

                    case 2:
                        return '[We wtorek o] LT';

                    case 3:
                        return '[W 힄rod휌 o] LT';

                    case 6:
                        return '[W sobot휌 o] LT';

                    default:
                        return '[W] dddd [o] LT';
                }
            },
            lastDay: '[Wczoraj o] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[W zesz흢훳 niedziel휌 o] LT';
                    case 3:
                        return '[W zesz흢훳 힄rod휌 o] LT';
                    case 6:
                        return '[W zesz흢훳 sobot휌 o] LT';
                    default:
                        return '[W zesz흢y] dddd [o] LT';
                }
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: 'za %s',
            past: '%s temu',
            s: 'kilka sekund',
            ss: translate$8,
            m: translate$8,
            mm: translate$8,
            h: translate$8,
            hh: translate$8,
            d: '1 dzie흦',
            dd: '%d dni',
            w: 'tydzie흦',
            ww: translate$8,
            M: 'miesi훳c',
            MM: translate$8,
            y: 'rok',
            yy: translate$8,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('pt-br', {
        months: 'janeiro_fevereiro_mar챌o_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro'.split(
            '_'
        ),
        monthsShort: 'jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez'.split('_'),
        weekdays: 'domingo_segunda-feira_ter챌a-feira_quarta-feira_quinta-feira_sexta-feira_s찼bado'.split(
            '_'
        ),
        weekdaysShort: 'dom_seg_ter_qua_qui_sex_s찼b'.split('_'),
        weekdaysMin: 'do_2짧_3짧_4짧_5짧_6짧_s찼'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D [de] MMMM [de] YYYY',
            LLL: 'D [de] MMMM [de] YYYY [횪s] HH:mm',
            LLLL: 'dddd, D [de] MMMM [de] YYYY [횪s] HH:mm',
        },
        calendar: {
            sameDay: '[Hoje 횪s] LT',
            nextDay: '[Amanh찾 횪s] LT',
            nextWeek: 'dddd [횪s] LT',
            lastDay: '[Ontem 횪s] LT',
            lastWeek: function () {
                return this.day() === 0 || this.day() === 6
                    ? '[횣ltimo] dddd [횪s] LT' // Saturday + Sunday
                    : '[횣ltima] dddd [횪s] LT'; // Monday - Friday
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: 'em %s',
            past: 'h찼 %s',
            s: 'poucos segundos',
            ss: '%d segundos',
            m: 'um minuto',
            mm: '%d minutos',
            h: 'uma hora',
            hh: '%d horas',
            d: 'um dia',
            dd: '%d dias',
            M: 'um m챗s',
            MM: '%d meses',
            y: 'um ano',
            yy: '%d anos',
        },
        dayOfMonthOrdinalParse: /\d{1,2}쨘/,
        ordinal: '%d쨘',
        invalidDate: 'Data inv찼lida',
    });

    //! moment.js locale configuration

    hooks.defineLocale('pt', {
        months: 'janeiro_fevereiro_mar챌o_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro'.split(
            '_'
        ),
        monthsShort: 'jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez'.split('_'),
        weekdays: 'Domingo_Segunda-feira_Ter챌a-feira_Quarta-feira_Quinta-feira_Sexta-feira_S찼bado'.split(
            '_'
        ),
        weekdaysShort: 'Dom_Seg_Ter_Qua_Qui_Sex_S찼b'.split('_'),
        weekdaysMin: 'Do_2짧_3짧_4짧_5짧_6짧_S찼'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D [de] MMMM [de] YYYY',
            LLL: 'D [de] MMMM [de] YYYY HH:mm',
            LLLL: 'dddd, D [de] MMMM [de] YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Hoje 횪s] LT',
            nextDay: '[Amanh찾 횪s] LT',
            nextWeek: 'dddd [횪s] LT',
            lastDay: '[Ontem 횪s] LT',
            lastWeek: function () {
                return this.day() === 0 || this.day() === 6
                    ? '[횣ltimo] dddd [횪s] LT' // Saturday + Sunday
                    : '[횣ltima] dddd [횪s] LT'; // Monday - Friday
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: 'em %s',
            past: 'h찼 %s',
            s: 'segundos',
            ss: '%d segundos',
            m: 'um minuto',
            mm: '%d minutos',
            h: 'uma hora',
            hh: '%d horas',
            d: 'um dia',
            dd: '%d dias',
            w: 'uma semana',
            ww: '%d semanas',
            M: 'um m챗s',
            MM: '%d meses',
            y: 'um ano',
            yy: '%d anos',
        },
        dayOfMonthOrdinalParse: /\d{1,2}쨘/,
        ordinal: '%d쨘',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    function relativeTimeWithPlural$2(number, withoutSuffix, key) {
        var format = {
                ss: 'secunde',
                mm: 'minute',
                hh: 'ore',
                dd: 'zile',
                ww: 's훱pt훱m창ni',
                MM: 'luni',
                yy: 'ani',
            },
            separator = ' ';
        if (number % 100 >= 20 || (number >= 100 && number % 100 === 0)) {
            separator = ' de ';
        }
        return number + separator + format[key];
    }

    hooks.defineLocale('ro', {
        months: 'ianuarie_februarie_martie_aprilie_mai_iunie_iulie_august_septembrie_octombrie_noiembrie_decembrie'.split(
            '_'
        ),
        monthsShort: 'ian._feb._mart._apr._mai_iun._iul._aug._sept._oct._nov._dec.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'duminic훱_luni_mar�i_miercuri_joi_vineri_s창mb훱t훱'.split('_'),
        weekdaysShort: 'Dum_Lun_Mar_Mie_Joi_Vin_S창m'.split('_'),
        weekdaysMin: 'Du_Lu_Ma_Mi_Jo_Vi_S창'.split('_'),
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY H:mm',
            LLLL: 'dddd, D MMMM YYYY H:mm',
        },
        calendar: {
            sameDay: '[azi la] LT',
            nextDay: '[m창ine la] LT',
            nextWeek: 'dddd [la] LT',
            lastDay: '[ieri la] LT',
            lastWeek: '[fosta] dddd [la] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'peste %s',
            past: '%s 챤n urm훱',
            s: 'c창teva secunde',
            ss: relativeTimeWithPlural$2,
            m: 'un minut',
            mm: relativeTimeWithPlural$2,
            h: 'o or훱',
            hh: relativeTimeWithPlural$2,
            d: 'o zi',
            dd: relativeTimeWithPlural$2,
            w: 'o s훱pt훱m창n훱',
            ww: relativeTimeWithPlural$2,
            M: 'o lun훱',
            MM: relativeTimeWithPlural$2,
            y: 'un an',
            yy: relativeTimeWithPlural$2,
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    function plural$4(word, num) {
        var forms = word.split('_');
        return num % 10 === 1 && num % 100 !== 11
            ? forms[0]
            : num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20)
                ? forms[1]
                : forms[2];
    }
    function relativeTimeWithPlural$3(number, withoutSuffix, key) {
        var format = {
            ss: withoutSuffix ? '�筠克�戟畇逵_�筠克�戟畇�_�筠克�戟畇' : '�筠克�戟畇�_�筠克�戟畇�_�筠克�戟畇',
            mm: withoutSuffix ? '劇龜戟��逵_劇龜戟���_劇龜戟��' : '劇龜戟���_劇龜戟���_劇龜戟��',
            hh: '�逵�_�逵�逵_�逵�棘勻',
            dd: '畇筠戟�_畇戟�_畇戟筠橘',
            ww: '戟筠畇筠剋�_戟筠畇筠剋龜_戟筠畇筠剋�',
            MM: '劇筠���_劇筠���逵_劇筠���筠勻',
            yy: '均棘畇_均棘畇逵_剋筠�',
        };
        if (key === 'm') {
            return withoutSuffix ? '劇龜戟��逵' : '劇龜戟���';
        } else {
            return number + ' ' + plural$4(format[key], +number);
        }
    }
    var monthsParse$b = [
        /^�戟勻/i,
        /^�筠勻/i,
        /^劇逵�/i,
        /^逵極�/i,
        /^劇逵[橘�]/i,
        /^龜�戟/i,
        /^龜�剋/i,
        /^逵勻均/i,
        /^�筠戟/i,
        /^棘克�/i,
        /^戟棘�/i,
        /^畇筠克/i,
    ];

    // http://new.gramota.ru/spravka/rules/139-prop : 짠 103
    // 鬼棘克�逵�筠戟龜� 劇筠���筠勻: http://new.gramota.ru/spravka/buro/search-answer?s=242637
    // CLDR data:          http://www.unicode.org/cldr/charts/28/summary/ru.html#1753
    hooks.defineLocale('ru', {
        months: {
            format: '�戟勻逵��_�筠勻�逵剋�_劇逵��逵_逵極�筠剋�_劇逵�_龜�戟�_龜�剋�_逵勻均���逵_�筠戟��閨��_棘克��閨��_戟棘�閨��_畇筠克逵閨��'.split(
                '_'
            ),
            standalone: '�戟勻逵��_�筠勻�逵剋�_劇逵��_逵極�筠剋�_劇逵橘_龜�戟�_龜�剋�_逵勻均���_�筠戟��閨��_棘克��閨��_戟棘�閨��_畇筠克逵閨��'.split(
                '_'
            ),
        },
        monthsShort: {
            // 極棘 CLDR 龜劇筠戟戟棘 "龜�剋." 龜 "龜�戟.", 戟棘 克逵克棘橘 �劇��剋 劇筠戟��� 閨�克勻� 戟逵 �棘�克�?
            format: '�戟勻._�筠勻�._劇逵�._逵極�._劇逵�_龜�戟�_龜�剋�_逵勻均._�筠戟�._棘克�._戟棘�閨._畇筠克.'.split(
                '_'
            ),
            standalone: '�戟勻._�筠勻�._劇逵��_逵極�._劇逵橘_龜�戟�_龜�剋�_逵勻均._�筠戟�._棘克�._戟棘�閨._畇筠克.'.split(
                '_'
            ),
        },
        weekdays: {
            standalone: '勻棘�克�筠�筠戟�筠_極棘戟筠畇筠剋�戟龜克_勻�棘�戟龜克_��筠畇逵_�筠�勻筠�均_極��戟龜�逵_��閨閨棘�逵'.split(
                '_'
            ),
            format: '勻棘�克�筠�筠戟�筠_極棘戟筠畇筠剋�戟龜克_勻�棘�戟龜克_��筠畇�_�筠�勻筠�均_極��戟龜��_��閨閨棘��'.split(
                '_'
            ),
            isFormat: /\[ ?[�勻] ?(?:極�棘�剋��|�剋筠畇�����|���)? ?] ?dddd/,
        },
        weekdaysShort: '勻�_極戟_勻�_��_��_極�_�閨'.split('_'),
        weekdaysMin: '勻�_極戟_勻�_��_��_極�_�閨'.split('_'),
        monthsParse: monthsParse$b,
        longMonthsParse: monthsParse$b,
        shortMonthsParse: monthsParse$b,

        // 極棘剋戟�筠 戟逵鈞勻逵戟龜� � 極逵畇筠菌逵劇龜, 極棘 ��龜 閨�克勻�, 畇剋� 戟筠克棘�棘���, 極棘 4 閨�克勻�, �棘克�逵�筠戟龜� � �棘�克棘橘 龜 閨筠鈞 �棘�克龜
        monthsRegex: /^(�戟勻逵�[��]|�戟勻\.?|�筠勻�逵剋[��]|�筠勻�?\.?|劇逵��逵?|劇逵�\.?|逵極�筠剋[��]|逵極�\.?|劇逵[橘�]|龜�戟[��]|龜�戟\.?|龜�剋[��]|龜�剋\.?|逵勻均���逵?|逵勻均\.?|�筠戟��閨�[��]|�筠戟�?\.?|棘克��閨�[��]|棘克�\.?|戟棘�閨�[��]|戟棘�閨?\.?|畇筠克逵閨�[��]|畇筠克\.?)/i,

        // 克棘極龜� 極�筠畇�畇��筠均棘
        monthsShortRegex: /^(�戟勻逵�[��]|�戟勻\.?|�筠勻�逵剋[��]|�筠勻�?\.?|劇逵��逵?|劇逵�\.?|逵極�筠剋[��]|逵極�\.?|劇逵[橘�]|龜�戟[��]|龜�戟\.?|龜�剋[��]|龜�剋\.?|逵勻均���逵?|逵勻均\.?|�筠戟��閨�[��]|�筠戟�?\.?|棘克��閨�[��]|棘克�\.?|戟棘�閨�[��]|戟棘�閨?\.?|畇筠克逵閨�[��]|畇筠克\.?)/i,

        // 極棘剋戟�筠 戟逵鈞勻逵戟龜� � 極逵畇筠菌逵劇龜
        monthsStrictRegex: /^(�戟勻逵�[��]|�筠勻�逵剋[��]|劇逵��逵?|逵極�筠剋[��]|劇逵[�橘]|龜�戟[��]|龜�剋[��]|逵勻均���逵?|�筠戟��閨�[��]|棘克��閨�[��]|戟棘�閨�[��]|畇筠克逵閨�[��])/i,

        // ���逵菌筠戟龜筠, 克棘�棘�棘筠 �棘棘�勻筠���勻�筠� �棘剋�克棘 �棘克�逵��戟戟�劇 �棘�劇逵劇
        monthsShortStrictRegex: /^(�戟勻\.|�筠勻�?\.|劇逵�[�.]|逵極�\.|劇逵[�橘]|龜�戟[��.]|龜�剋[��.]|逵勻均\.|�筠戟�?\.|棘克�\.|戟棘�閨?\.|畇筠克\.)/i,
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D MMMM YYYY 均.',
            LLL: 'D MMMM YYYY 均., H:mm',
            LLLL: 'dddd, D MMMM YYYY 均., H:mm',
        },
        calendar: {
            sameDay: '[鬼筠均棘畇戟�, 勻] LT',
            nextDay: '[�逵勻��逵, 勻] LT',
            lastDay: '[��筠�逵, 勻] LT',
            nextWeek: function (now) {
                if (now.week() !== this.week()) {
                    switch (this.day()) {
                        case 0:
                            return '[� �剋筠畇���筠筠] dddd, [勻] LT';
                        case 1:
                        case 2:
                        case 4:
                            return '[� �剋筠畇���龜橘] dddd, [勻] LT';
                        case 3:
                        case 5:
                        case 6:
                            return '[� �剋筠畇�����] dddd, [勻] LT';
                    }
                } else {
                    if (this.day() === 2) {
                        return '[�棘] dddd, [勻] LT';
                    } else {
                        return '[�] dddd, [勻] LT';
                    }
                }
            },
            lastWeek: function (now) {
                if (now.week() !== this.week()) {
                    switch (this.day()) {
                        case 0:
                            return '[� 極�棘�剋棘筠] dddd, [勻] LT';
                        case 1:
                        case 2:
                        case 4:
                            return '[� 極�棘�剋�橘] dddd, [勻] LT';
                        case 3:
                        case 5:
                        case 6:
                            return '[� 極�棘�剋��] dddd, [勻] LT';
                    }
                } else {
                    if (this.day() === 2) {
                        return '[�棘] dddd, [勻] LT';
                    } else {
                        return '[�] dddd, [勻] LT';
                    }
                }
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: '�筠�筠鈞 %s',
            past: '%s 戟逵鈞逵畇',
            s: '戟筠�克棘剋�克棘 �筠克�戟畇',
            ss: relativeTimeWithPlural$3,
            m: relativeTimeWithPlural$3,
            mm: relativeTimeWithPlural$3,
            h: '�逵�',
            hh: relativeTimeWithPlural$3,
            d: '畇筠戟�',
            dd: relativeTimeWithPlural$3,
            w: '戟筠畇筠剋�',
            ww: relativeTimeWithPlural$3,
            M: '劇筠���',
            MM: relativeTimeWithPlural$3,
            y: '均棘畇',
            yy: relativeTimeWithPlural$3,
        },
        meridiemParse: /戟棘�龜|���逵|畇戟�|勻筠�筠�逵/i,
        isPM: function (input) {
            return /^(畇戟�|勻筠�筠�逵)$/.test(input);
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 4) {
                return '戟棘�龜';
            } else if (hour < 12) {
                return '���逵';
            } else if (hour < 17) {
                return '畇戟�';
            } else {
                return '勻筠�筠�逵';
            }
        },
        dayOfMonthOrdinalParse: /\d{1,2}-(橘|均棘|�)/,
        ordinal: function (number, period) {
            switch (period) {
                case 'M':
                case 'd':
                case 'DDD':
                    return number + '-橘';
                case 'D':
                    return number + '-均棘';
                case 'w':
                case 'W':
                    return number + '-�';
                default:
                    return number;
            }
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var months$9 = [
            '寞��邈�',
            '��磨邈�邈�',
            '�碼邈�',
            '碼毛邈��',
            '�痲�',
            '寞��',
            '寞��碼立�',
            '笠彌卍母',
            '卍�毛母�磨邈',
            '笠物母�磨邈',
            '���磨邈',
            '�卍�磨邈',
        ],
        days$1 = ['笠�邈', '卍��邈', '碼未碼邈�', '碼邈磨晩', '漠��卍', '寞�晩', '���邈'];

    hooks.defineLocale('sd', {
        months: months$9,
        monthsShort: months$9,
        weekdays: days$1,
        weekdaysShort: days$1,
        weekdaysMin: days$1,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd� D MMMM YYYY HH:mm',
        },
        meridiemParse: /巒磨幕|娩碼�/,
        isPM: function (input) {
            return '娩碼�' === input;
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 12) {
                return '巒磨幕';
            }
            return '娩碼�';
        },
        calendar: {
            sameDay: '[碼�] LT',
            nextDay: '[卍�碼迷�] LT',
            nextWeek: 'dddd [碼楣�� ��魔� 魔�] LT',
            lastDay: '[物碼���] LT',
            lastWeek: '[彌万邈�� ��魔�] dddd [魔�] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s 毛�立',
            past: '%s 碼楣',
            s: '��膜 卍�物��',
            ss: '%d 卍�物��',
            m: '�物 ��母',
            mm: '%d ��母',
            h: '�物 物�碼物',
            hh: '%d 物�碼物',
            d: '�物 �����',
            dd: '%d �����',
            M: '�物 �����',
            MM: '%d ����碼',
            y: '�物 卍碼�',
            yy: '%d 卍碼�',
        },
        preparse: function (string) {
            return string.replace(/�/g, ',');
        },
        postformat: function (string) {
            return string.replace(/,/g, '�');
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('se', {
        months: 'o휃휃ajagem찼nnu_guovvam찼nnu_njuk훾am찼nnu_cuo흯om찼nnu_miessem찼nnu_geassem찼nnu_suoidnem찼nnu_borgem찼nnu_훾ak훾am찼nnu_golggotm찼nnu_sk찼bmam찼nnu_juovlam찼nnu'.split(
            '_'
        ),
        monthsShort: 'o휃휃j_guov_njuk_cuo_mies_geas_suoi_borg_훾ak훾_golg_sk찼b_juov'.split(
            '_'
        ),
        weekdays: 'sotnabeaivi_vuoss찼rga_ma흯흯eb찼rga_gaskavahkku_duorastat_bearjadat_l찼vvardat'.split(
            '_'
        ),
        weekdaysShort: 'sotn_vuos_ma흯_gask_duor_bear_l찼v'.split('_'),
        weekdaysMin: 's_v_m_g_d_b_L'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'MMMM D. [b.] YYYY',
            LLL: 'MMMM D. [b.] YYYY [ti.] HH:mm',
            LLLL: 'dddd, MMMM D. [b.] YYYY [ti.] HH:mm',
        },
        calendar: {
            sameDay: '[otne ti] LT',
            nextDay: '[ihttin ti] LT',
            nextWeek: 'dddd [ti] LT',
            lastDay: '[ikte ti] LT',
            lastWeek: '[ovddit] dddd [ti] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s gea탑es',
            past: 'ma흯it %s',
            s: 'moadde sekunddat',
            ss: '%d sekunddat',
            m: 'okta minuhta',
            mm: '%d minuhtat',
            h: 'okta diimmu',
            hh: '%d diimmut',
            d: 'okta beaivi',
            dd: '%d beaivvit',
            M: 'okta m찼nnu',
            MM: '%d m찼nut',
            y: 'okta jahki',
            yy: '%d jagit',
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    /*jshint -W100*/
    hooks.defineLocale('si', {
        months: '蓆№떡釋�釋뤲떻釋�_蓆닮퇈蓆뜩떻釋�釋뤲떻釋�_蓆멘톽蓆삑톶蓆�퇃_蓆끶떪釋듼�띭떻釋싟떽釋�_蓆멘톾蓆뷕퇁_蓆№퇅蓆긍퇁_蓆№퇅蓆썅퇁_蓆끶텧釋앧톫釋듺땟釋�_釋꺺톾蓆닮톶蓆�톾蓆멘톶蓆뜩떻釋�_蓆붲텥釋듺땟釋앧떰蓆삑톶_蓆긍퇋釋�釋먣떳釋듺떰蓆삑톶_蓆�퇈釋꺺톾蓆멘톶蓆뜩떻釋�'.split(
            '_'
        ),
        monthsShort: '蓆№떡_蓆닮퇈蓆�_蓆멘톽蓆삑톶_蓆끶떪釋�_蓆멘톾蓆뷕퇁_蓆№퇅蓆긍퇁_蓆№퇅蓆썅퇁_蓆끶텧釋�_釋꺺톾蓆닮톶_蓆붲텥釋�_蓆긍퇋釋�釋�_蓆�퇈釋꺺톾'.split(
            '_'
        ),
        weekdays: '蓆됢떻釋믞땡釋�_釋꺺떨釋붲땡釋�_蓆끶텫釋꾝떻釋붲�釋뤲땡釋�_蓆뜩땡釋뤲땡釋�_蓆뜩톶�띭떻釋꾝톫釋듺떪蓆�퇁蓆긍톶蓆�톽_釋꺺퇁蓆싟퇃蓆삑톽蓆�톽_釋꺺퇈蓆긍톫釋붲떻釋뤲땡釋�'.split(
            '_'
        ),
        weekdaysShort: '蓆됢떻釋�_釋꺺떨釋�_蓆끶텫_蓆뜩땡釋�_蓆뜩톶�띭떻釋�_釋꺺퇁蓆싟퇃_釋꺺퇈蓆�'.split('_'),
        weekdaysMin: '蓆�_釋�_蓆�_蓆�_蓆뜩톶�띭떻_釋꺺퇁_釋꺺퇈'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'a h:mm',
            LTS: 'a h:mm:ss',
            L: 'YYYY/MM/DD',
            LL: 'YYYY MMMM D',
            LLL: 'YYYY MMMM D, a h:mm',
            LLLL: 'YYYY MMMM D [釋�釋먣떡釋�] dddd, a h:mm:ss',
        },
        calendar: {
            sameDay: '[蓆끶땡] LT[蓆�]',
            nextDay: '[釋꾝퇈蓆�] LT[蓆�]',
            nextWeek: 'dddd LT[蓆�]',
            lastDay: '[蓆듺떵釋�] LT[蓆�]',
            lastWeek: '[蓆닮톫釋붲텧釋믞떵] dddd LT[蓆�]',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s蓆싟퇁蓆긍톶',
            past: '%s蓆싟때 蓆닮퇈蓆�',
            s: '蓆�땟釋듺떪蓆� 蓆싟퇁釋꾝퇁蓆닮떵',
            ss: '蓆�땟釋듺떪蓆� %d',
            m: '蓆멘퇁蓆긍퇁蓆�톶蓆�퇃釋�',
            mm: '蓆멘퇁蓆긍퇁蓆�톶蓆�퇃 %d',
            h: '蓆닮톾蓆�',
            hh: '蓆닮톾蓆� %d',
            d: '蓆�퇁蓆긍떵',
            dd: '蓆�퇁蓆� %d',
            M: '蓆멘톽釋꺺떵',
            MM: '蓆멘톽釋� %d',
            y: '釋�釋꺺떻',
            yy: '釋�釋꺺떻 %d',
        },
        dayOfMonthOrdinalParse: /\d{1,2} 釋�釋먣떡釋�/,
        ordinal: function (number) {
            return number + ' 釋�釋먣떡釋�';
        },
        meridiemParse: /蓆닮퇈蓆� 釋�蓆삑퇃|蓆닮톫釋� 釋�蓆삑퇃|蓆닮퇈.釋�|蓆�.釋�./,
        isPM: function (input) {
            return input === '蓆�.釋�.' || input === '蓆닮톫釋� 釋�蓆삑퇃';
        },
        meridiem: function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? '蓆�.釋�.' : '蓆닮톫釋� 釋�蓆삑퇃';
            } else {
                return isLower ? '蓆닮퇈.釋�.' : '蓆닮퇈蓆� 釋�蓆삑퇃';
            }
        },
    });

    //! moment.js locale configuration

    var months$a = 'janu찼r_febru찼r_marec_apr챠l_m찼j_j첬n_j첬l_august_september_okt처ber_november_december'.split(
            '_'
        ),
        monthsShort$7 = 'jan_feb_mar_apr_m찼j_j첬n_j첬l_aug_sep_okt_nov_dec'.split('_');
    function plural$5(n) {
        return n > 1 && n < 5;
    }
    function translate$9(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        switch (key) {
            case 's': // a few seconds / in a few seconds / a few seconds ago
                return withoutSuffix || isFuture ? 'p찼r sek첬nd' : 'p찼r sekundami';
            case 'ss': // 9 seconds / in 9 seconds / 9 seconds ago
                if (withoutSuffix || isFuture) {
                    return result + (plural$5(number) ? 'sekundy' : 'sek첬nd');
                } else {
                    return result + 'sekundami';
                }
            case 'm': // a minute / in a minute / a minute ago
                return withoutSuffix ? 'min첬ta' : isFuture ? 'min첬tu' : 'min첬tou';
            case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
                if (withoutSuffix || isFuture) {
                    return result + (plural$5(number) ? 'min첬ty' : 'min첬t');
                } else {
                    return result + 'min첬tami';
                }
            case 'h': // an hour / in an hour / an hour ago
                return withoutSuffix ? 'hodina' : isFuture ? 'hodinu' : 'hodinou';
            case 'hh': // 9 hours / in 9 hours / 9 hours ago
                if (withoutSuffix || isFuture) {
                    return result + (plural$5(number) ? 'hodiny' : 'hod챠n');
                } else {
                    return result + 'hodinami';
                }
            case 'd': // a day / in a day / a day ago
                return withoutSuffix || isFuture ? 'de흫' : 'd흫om';
            case 'dd': // 9 days / in 9 days / 9 days ago
                if (withoutSuffix || isFuture) {
                    return result + (plural$5(number) ? 'dni' : 'dn챠');
                } else {
                    return result + 'd흫ami';
                }
            case 'M': // a month / in a month / a month ago
                return withoutSuffix || isFuture ? 'mesiac' : 'mesiacom';
            case 'MM': // 9 months / in 9 months / 9 months ago
                if (withoutSuffix || isFuture) {
                    return result + (plural$5(number) ? 'mesiace' : 'mesiacov');
                } else {
                    return result + 'mesiacmi';
                }
            case 'y': // a year / in a year / a year ago
                return withoutSuffix || isFuture ? 'rok' : 'rokom';
            case 'yy': // 9 years / in 9 years / 9 years ago
                if (withoutSuffix || isFuture) {
                    return result + (plural$5(number) ? 'roky' : 'rokov');
                } else {
                    return result + 'rokmi';
                }
        }
    }

    hooks.defineLocale('sk', {
        months: months$a,
        monthsShort: monthsShort$7,
        weekdays: 'nede컁a_pondelok_utorok_streda_큄tvrtok_piatok_sobota'.split('_'),
        weekdaysShort: 'ne_po_ut_st_큄t_pi_so'.split('_'),
        weekdaysMin: 'ne_po_ut_st_큄t_pi_so'.split('_'),
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY H:mm',
            LLLL: 'dddd D. MMMM YYYY H:mm',
        },
        calendar: {
            sameDay: '[dnes o] LT',
            nextDay: '[zajtra o] LT',
            nextWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[v nede컁u o] LT';
                    case 1:
                    case 2:
                        return '[v] dddd [o] LT';
                    case 3:
                        return '[v stredu o] LT';
                    case 4:
                        return '[vo 큄tvrtok o] LT';
                    case 5:
                        return '[v piatok o] LT';
                    case 6:
                        return '[v sobotu o] LT';
                }
            },
            lastDay: '[v훾era o] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[minul첬 nede컁u o] LT';
                    case 1:
                    case 2:
                        return '[minul첵] dddd [o] LT';
                    case 3:
                        return '[minul첬 stredu o] LT';
                    case 4:
                    case 5:
                        return '[minul첵] dddd [o] LT';
                    case 6:
                        return '[minul첬 sobotu o] LT';
                }
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: 'za %s',
            past: 'pred %s',
            s: translate$9,
            ss: translate$9,
            m: translate$9,
            mm: translate$9,
            h: translate$9,
            hh: translate$9,
            d: translate$9,
            dd: translate$9,
            M: translate$9,
            MM: translate$9,
            y: translate$9,
            yy: translate$9,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    function processRelativeTime$7(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        switch (key) {
            case 's':
                return withoutSuffix || isFuture
                    ? 'nekaj sekund'
                    : 'nekaj sekundami';
            case 'ss':
                if (number === 1) {
                    result += withoutSuffix ? 'sekundo' : 'sekundi';
                } else if (number === 2) {
                    result += withoutSuffix || isFuture ? 'sekundi' : 'sekundah';
                } else if (number < 5) {
                    result += withoutSuffix || isFuture ? 'sekunde' : 'sekundah';
                } else {
                    result += 'sekund';
                }
                return result;
            case 'm':
                return withoutSuffix ? 'ena minuta' : 'eno minuto';
            case 'mm':
                if (number === 1) {
                    result += withoutSuffix ? 'minuta' : 'minuto';
                } else if (number === 2) {
                    result += withoutSuffix || isFuture ? 'minuti' : 'minutama';
                } else if (number < 5) {
                    result += withoutSuffix || isFuture ? 'minute' : 'minutami';
                } else {
                    result += withoutSuffix || isFuture ? 'minut' : 'minutami';
                }
                return result;
            case 'h':
                return withoutSuffix ? 'ena ura' : 'eno uro';
            case 'hh':
                if (number === 1) {
                    result += withoutSuffix ? 'ura' : 'uro';
                } else if (number === 2) {
                    result += withoutSuffix || isFuture ? 'uri' : 'urama';
                } else if (number < 5) {
                    result += withoutSuffix || isFuture ? 'ure' : 'urami';
                } else {
                    result += withoutSuffix || isFuture ? 'ur' : 'urami';
                }
                return result;
            case 'd':
                return withoutSuffix || isFuture ? 'en dan' : 'enim dnem';
            case 'dd':
                if (number === 1) {
                    result += withoutSuffix || isFuture ? 'dan' : 'dnem';
                } else if (number === 2) {
                    result += withoutSuffix || isFuture ? 'dni' : 'dnevoma';
                } else {
                    result += withoutSuffix || isFuture ? 'dni' : 'dnevi';
                }
                return result;
            case 'M':
                return withoutSuffix || isFuture ? 'en mesec' : 'enim mesecem';
            case 'MM':
                if (number === 1) {
                    result += withoutSuffix || isFuture ? 'mesec' : 'mesecem';
                } else if (number === 2) {
                    result += withoutSuffix || isFuture ? 'meseca' : 'mesecema';
                } else if (number < 5) {
                    result += withoutSuffix || isFuture ? 'mesece' : 'meseci';
                } else {
                    result += withoutSuffix || isFuture ? 'mesecev' : 'meseci';
                }
                return result;
            case 'y':
                return withoutSuffix || isFuture ? 'eno leto' : 'enim letom';
            case 'yy':
                if (number === 1) {
                    result += withoutSuffix || isFuture ? 'leto' : 'letom';
                } else if (number === 2) {
                    result += withoutSuffix || isFuture ? 'leti' : 'letoma';
                } else if (number < 5) {
                    result += withoutSuffix || isFuture ? 'leta' : 'leti';
                } else {
                    result += withoutSuffix || isFuture ? 'let' : 'leti';
                }
                return result;
        }
    }

    hooks.defineLocale('sl', {
        months: 'januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december'.split(
            '_'
        ),
        monthsShort: 'jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'nedelja_ponedeljek_torek_sreda_훾etrtek_petek_sobota'.split('_'),
        weekdaysShort: 'ned._pon._tor._sre._훾et._pet._sob.'.split('_'),
        weekdaysMin: 'ne_po_to_sr_훾e_pe_so'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'DD. MM. YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY H:mm',
            LLLL: 'dddd, D. MMMM YYYY H:mm',
        },
        calendar: {
            sameDay: '[danes ob] LT',
            nextDay: '[jutri ob] LT',

            nextWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[v] [nedeljo] [ob] LT';
                    case 3:
                        return '[v] [sredo] [ob] LT';
                    case 6:
                        return '[v] [soboto] [ob] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[v] dddd [ob] LT';
                }
            },
            lastDay: '[v훾eraj ob] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[prej큄njo] [nedeljo] [ob] LT';
                    case 3:
                        return '[prej큄njo] [sredo] [ob] LT';
                    case 6:
                        return '[prej큄njo] [soboto] [ob] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[prej큄nji] dddd [ob] LT';
                }
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: '훾ez %s',
            past: 'pred %s',
            s: processRelativeTime$7,
            ss: processRelativeTime$7,
            m: processRelativeTime$7,
            mm: processRelativeTime$7,
            h: processRelativeTime$7,
            hh: processRelativeTime$7,
            d: processRelativeTime$7,
            dd: processRelativeTime$7,
            M: processRelativeTime$7,
            MM: processRelativeTime$7,
            y: processRelativeTime$7,
            yy: processRelativeTime$7,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('sq', {
        months: 'Janar_Shkurt_Mars_Prill_Maj_Qershor_Korrik_Gusht_Shtator_Tetor_N챘ntor_Dhjetor'.split(
            '_'
        ),
        monthsShort: 'Jan_Shk_Mar_Pri_Maj_Qer_Kor_Gus_Sht_Tet_N챘n_Dhj'.split('_'),
        weekdays: 'E Diel_E H챘n챘_E Mart챘_E M챘rkur챘_E Enjte_E Premte_E Shtun챘'.split(
            '_'
        ),
        weekdaysShort: 'Die_H챘n_Mar_M챘r_Enj_Pre_Sht'.split('_'),
        weekdaysMin: 'D_H_Ma_M챘_E_P_Sh'.split('_'),
        weekdaysParseExact: true,
        meridiemParse: /PD|MD/,
        isPM: function (input) {
            return input.charAt(0) === 'M';
        },
        meridiem: function (hours, minutes, isLower) {
            return hours < 12 ? 'PD' : 'MD';
        },
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Sot n챘] LT',
            nextDay: '[Nes챘r n챘] LT',
            nextWeek: 'dddd [n챘] LT',
            lastDay: '[Dje n챘] LT',
            lastWeek: 'dddd [e kaluar n챘] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'n챘 %s',
            past: '%s m챘 par챘',
            s: 'disa sekonda',
            ss: '%d sekonda',
            m: 'nj챘 minut챘',
            mm: '%d minuta',
            h: 'nj챘 or챘',
            hh: '%d or챘',
            d: 'nj챘 dit챘',
            dd: '%d dit챘',
            M: 'nj챘 muaj',
            MM: '%d muaj',
            y: 'nj챘 vit',
            yy: '%d vite',
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var translator$1 = {
        words: {
            //Different grammatical cases
            ss: ['�筠克�戟畇逵', '�筠克�戟畇筠', '�筠克�戟畇龜'],
            m: ['�筠畇逵戟 劇龜戟��', '�筠畇戟筠 劇龜戟��筠'],
            mm: ['劇龜戟��', '劇龜戟��筠', '劇龜戟��逵'],
            h: ['�筠畇逵戟 �逵�', '�筠畇戟棘均 �逵�逵'],
            hh: ['�逵�', '�逵�逵', '�逵�龜'],
            dd: ['畇逵戟', '畇逵戟逵', '畇逵戟逵'],
            MM: ['劇筠�筠�', '劇筠�筠�逵', '劇筠�筠�龜'],
            yy: ['均棘畇龜戟逵', '均棘畇龜戟筠', '均棘畇龜戟逵'],
        },
        correctGrammaticalCase: function (number, wordKey) {
            return number === 1
                ? wordKey[0]
                : number >= 2 && number <= 4
                    ? wordKey[1]
                    : wordKey[2];
        },
        translate: function (number, withoutSuffix, key) {
            var wordKey = translator$1.words[key];
            if (key.length === 1) {
                return withoutSuffix ? wordKey[0] : wordKey[1];
            } else {
                return (
                    number +
                    ' ' +
                    translator$1.correctGrammaticalCase(number, wordKey)
                );
            }
        },
    };

    hooks.defineLocale('sr-cyrl', {
        months: '�逵戟�逵�_�筠閨��逵�_劇逵��_逵極�龜剋_劇逵�_��戟_��剋_逵勻均���_�筠極�筠劇閨逵�_棘克�棘閨逵�_戟棘勻筠劇閨逵�_畇筠�筠劇閨逵�'.split(
            '_'
        ),
        monthsShort: '�逵戟._�筠閨._劇逵�._逵極�._劇逵�_��戟_��剋_逵勻均._�筠極._棘克�._戟棘勻._畇筠�.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: '戟筠畇筠�逵_極棘戟筠畇筠�逵克_��棘�逵克_��筠畇逵_�筠�勻��逵克_極筠�逵克_��閨棘�逵'.split('_'),
        weekdaysShort: '戟筠畇._極棘戟._��棘._��筠._�筠�._極筠�._��閨.'.split('_'),
        weekdaysMin: '戟筠_極棘_��_��_�筠_極筠_��'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'D. M. YYYY.',
            LL: 'D. MMMM YYYY.',
            LLL: 'D. MMMM YYYY. H:mm',
            LLLL: 'dddd, D. MMMM YYYY. H:mm',
        },
        calendar: {
            sameDay: '[畇逵戟逵� �] LT',
            nextDay: '[����逵 �] LT',
            nextWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[�] [戟筠畇筠��] [�] LT';
                    case 3:
                        return '[�] [��筠畇�] [�] LT';
                    case 6:
                        return '[�] [��閨棘��] [�] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[�] dddd [�] LT';
                }
            },
            lastDay: '[���筠 �] LT',
            lastWeek: function () {
                var lastWeekDays = [
                    '[極�棘�剋筠] [戟筠畇筠�筠] [�] LT',
                    '[極�棘�剋棘均] [極棘戟筠畇筠�克逵] [�] LT',
                    '[極�棘�剋棘均] [��棘�克逵] [�] LT',
                    '[極�棘�剋筠] [��筠畇筠] [�] LT',
                    '[極�棘�剋棘均] [�筠�勻��克逵] [�] LT',
                    '[極�棘�剋棘均] [極筠�克逵] [�] LT',
                    '[極�棘�剋筠] [��閨棘�筠] [�] LT',
                ];
                return lastWeekDays[this.day()];
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: '鈞逵 %s',
            past: '極�筠 %s',
            s: '戟筠克棘剋龜克棘 �筠克�戟畇龜',
            ss: translator$1.translate,
            m: translator$1.translate,
            mm: translator$1.translate,
            h: translator$1.translate,
            hh: translator$1.translate,
            d: '畇逵戟',
            dd: translator$1.translate,
            M: '劇筠�筠�',
            MM: translator$1.translate,
            y: '均棘畇龜戟�',
            yy: translator$1.translate,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 1st is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var translator$2 = {
        words: {
            //Different grammatical cases
            ss: ['sekunda', 'sekunde', 'sekundi'],
            m: ['jedan minut', 'jedne minute'],
            mm: ['minut', 'minute', 'minuta'],
            h: ['jedan sat', 'jednog sata'],
            hh: ['sat', 'sata', 'sati'],
            dd: ['dan', 'dana', 'dana'],
            MM: ['mesec', 'meseca', 'meseci'],
            yy: ['godina', 'godine', 'godina'],
        },
        correctGrammaticalCase: function (number, wordKey) {
            return number === 1
                ? wordKey[0]
                : number >= 2 && number <= 4
                    ? wordKey[1]
                    : wordKey[2];
        },
        translate: function (number, withoutSuffix, key) {
            var wordKey = translator$2.words[key];
            if (key.length === 1) {
                return withoutSuffix ? wordKey[0] : wordKey[1];
            } else {
                return (
                    number +
                    ' ' +
                    translator$2.correctGrammaticalCase(number, wordKey)
                );
            }
        },
    };

    hooks.defineLocale('sr', {
        months: 'januar_februar_mart_april_maj_jun_jul_avgust_septembar_oktobar_novembar_decembar'.split(
            '_'
        ),
        monthsShort: 'jan._feb._mar._apr._maj_jun_jul_avg._sep._okt._nov._dec.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'nedelja_ponedeljak_utorak_sreda_훾etvrtak_petak_subota'.split(
            '_'
        ),
        weekdaysShort: 'ned._pon._uto._sre._훾et._pet._sub.'.split('_'),
        weekdaysMin: 'ne_po_ut_sr_훾e_pe_su'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'D. M. YYYY.',
            LL: 'D. MMMM YYYY.',
            LLL: 'D. MMMM YYYY. H:mm',
            LLLL: 'dddd, D. MMMM YYYY. H:mm',
        },
        calendar: {
            sameDay: '[danas u] LT',
            nextDay: '[sutra u] LT',
            nextWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[u] [nedelju] [u] LT';
                    case 3:
                        return '[u] [sredu] [u] LT';
                    case 6:
                        return '[u] [subotu] [u] LT';
                    case 1:
                    case 2:
                    case 4:
                    case 5:
                        return '[u] dddd [u] LT';
                }
            },
            lastDay: '[ju훾e u] LT',
            lastWeek: function () {
                var lastWeekDays = [
                    '[pro큄le] [nedelje] [u] LT',
                    '[pro큄log] [ponedeljka] [u] LT',
                    '[pro큄log] [utorka] [u] LT',
                    '[pro큄le] [srede] [u] LT',
                    '[pro큄log] [훾etvrtka] [u] LT',
                    '[pro큄log] [petka] [u] LT',
                    '[pro큄le] [subote] [u] LT',
                ];
                return lastWeekDays[this.day()];
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: 'za %s',
            past: 'pre %s',
            s: 'nekoliko sekundi',
            ss: translator$2.translate,
            m: translator$2.translate,
            mm: translator$2.translate,
            h: translator$2.translate,
            hh: translator$2.translate,
            d: 'dan',
            dd: translator$2.translate,
            M: 'mesec',
            MM: translator$2.translate,
            y: 'godinu',
            yy: translator$2.translate,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('ss', {
        months: "Bhimbidvwane_Indlovana_Indlov'lenkhulu_Mabasa_Inkhwekhweti_Inhlaba_Kholwane_Ingci_Inyoni_Imphala_Lweti_Ingongoni".split(
            '_'
        ),
        monthsShort: 'Bhi_Ina_Inu_Mab_Ink_Inh_Kho_Igc_Iny_Imp_Lwe_Igo'.split('_'),
        weekdays: 'Lisontfo_Umsombuluko_Lesibili_Lesitsatfu_Lesine_Lesihlanu_Umgcibelo'.split(
            '_'
        ),
        weekdaysShort: 'Lis_Umb_Lsb_Les_Lsi_Lsh_Umg'.split('_'),
        weekdaysMin: 'Li_Us_Lb_Lt_Ls_Lh_Ug'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'h:mm A',
            LTS: 'h:mm:ss A',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY h:mm A',
            LLLL: 'dddd, D MMMM YYYY h:mm A',
        },
        calendar: {
            sameDay: '[Namuhla nga] LT',
            nextDay: '[Kusasa nga] LT',
            nextWeek: 'dddd [nga] LT',
            lastDay: '[Itolo nga] LT',
            lastWeek: 'dddd [leliphelile] [nga] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'nga %s',
            past: 'wenteka nga %s',
            s: 'emizuzwana lomcane',
            ss: '%d mzuzwana',
            m: 'umzuzu',
            mm: '%d emizuzu',
            h: 'lihora',
            hh: '%d emahora',
            d: 'lilanga',
            dd: '%d emalanga',
            M: 'inyanga',
            MM: '%d tinyanga',
            y: 'umnyaka',
            yy: '%d iminyaka',
        },
        meridiemParse: /ekuseni|emini|entsambama|ebusuku/,
        meridiem: function (hours, minutes, isLower) {
            if (hours < 11) {
                return 'ekuseni';
            } else if (hours < 15) {
                return 'emini';
            } else if (hours < 19) {
                return 'entsambama';
            } else {
                return 'ebusuku';
            }
        },
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'ekuseni') {
                return hour;
            } else if (meridiem === 'emini') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === 'entsambama' || meridiem === 'ebusuku') {
                if (hour === 0) {
                    return 0;
                }
                return hour + 12;
            }
        },
        dayOfMonthOrdinalParse: /\d{1,2}/,
        ordinal: '%d',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('sv', {
        months: 'januari_februari_mars_april_maj_juni_juli_augusti_september_oktober_november_december'.split(
            '_'
        ),
        monthsShort: 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split('_'),
        weekdays: 's철ndag_m책ndag_tisdag_onsdag_torsdag_fredag_l철rdag'.split('_'),
        weekdaysShort: 's철n_m책n_tis_ons_tor_fre_l철r'.split('_'),
        weekdaysMin: 's철_m책_ti_on_to_fr_l철'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'YYYY-MM-DD',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY [kl.] HH:mm',
            LLLL: 'dddd D MMMM YYYY [kl.] HH:mm',
            lll: 'D MMM YYYY HH:mm',
            llll: 'ddd D MMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Idag] LT',
            nextDay: '[Imorgon] LT',
            lastDay: '[Ig책r] LT',
            nextWeek: '[P책] dddd LT',
            lastWeek: '[I] dddd[s] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'om %s',
            past: 'f철r %s sedan',
            s: 'n책gra sekunder',
            ss: '%d sekunder',
            m: 'en minut',
            mm: '%d minuter',
            h: 'en timme',
            hh: '%d timmar',
            d: 'en dag',
            dd: '%d dagar',
            M: 'en m책nad',
            MM: '%d m책nader',
            y: 'ett 책r',
            yy: '%d 책r',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(\:e|\:a)/,
        ordinal: function (number) {
            var b = number % 10,
                output =
                    ~~((number % 100) / 10) === 1
                        ? ':e'
                        : b === 1
                            ? ':a'
                            : b === 2
                                ? ':a'
                                : b === 3
                                    ? ':e'
                                    : ':e';
            return number + output;
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('sw', {
        months: 'Januari_Februari_Machi_Aprili_Mei_Juni_Julai_Agosti_Septemba_Oktoba_Novemba_Desemba'.split(
            '_'
        ),
        monthsShort: 'Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ago_Sep_Okt_Nov_Des'.split('_'),
        weekdays: 'Jumapili_Jumatatu_Jumanne_Jumatano_Alhamisi_Ijumaa_Jumamosi'.split(
            '_'
        ),
        weekdaysShort: 'Jpl_Jtat_Jnne_Jtan_Alh_Ijm_Jmos'.split('_'),
        weekdaysMin: 'J2_J3_J4_J5_Al_Ij_J1'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'hh:mm A',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[leo saa] LT',
            nextDay: '[kesho saa] LT',
            nextWeek: '[wiki ijayo] dddd [saat] LT',
            lastDay: '[jana] LT',
            lastWeek: '[wiki iliyopita] dddd [saat] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s baadaye',
            past: 'tokea %s',
            s: 'hivi punde',
            ss: 'sekunde %d',
            m: 'dakika moja',
            mm: 'dakika %d',
            h: 'saa limoja',
            hh: 'masaa %d',
            d: 'siku moja',
            dd: 'siku %d',
            M: 'mwezi mmoja',
            MM: 'miezi %d',
            y: 'mwaka mmoja',
            yy: 'miaka %d',
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var symbolMap$g = {
            1: '晳�',
            2: '晳�',
            3: '晳�',
            4: '晳�',
            5: '晳�',
            6: '晳�',
            7: '晳�',
            8: '晳�',
            9: '晳�',
            0: '晳�',
        },
        numberMap$f = {
            '晳�': '1',
            '晳�': '2',
            '晳�': '3',
            '晳�': '4',
            '晳�': '5',
            '晳�': '6',
            '晳�': '7',
            '晳�': '8',
            '晳�': '9',
            '晳�': '0',
        };

    hooks.defineLocale('ta', {
        months: '昔쒉�昔듀�昔�_昔む�昔む칾昔겯�昔겯�_昔��昔겯칾昔싟칾_昔뤲�晳띭�昔꿋칾_昔�칶_昔쒉칯昔⒯칾_昔쒉칯昔꿋칷_昔녱츜昔멘칾昔잀칾_昔싟칳昔む칾昔잀칳昔�칾昔む�晳�_昔끶츜晳띭츪晳뉋�昔む�晳�_昔ⓣ�昔�칾昔む�晳�_昔잀�昔싟�晳띭�昔겯칾'.split(
            '_'
        ),
        monthsShort: '昔쒉�昔듀�昔�_昔む�昔む칾昔겯�昔겯�_昔��昔겯칾昔싟칾_昔뤲�晳띭�昔꿋칾_昔�칶_昔쒉칯昔⒯칾_昔쒉칯昔꿋칷_昔녱츜昔멘칾昔잀칾_昔싟칳昔む칾昔잀칳昔�칾昔む�晳�_昔끶츜晳띭츪晳뉋�昔む�晳�_昔ⓣ�昔�칾昔む�晳�_昔잀�昔싟�晳띭�昔겯칾'.split(
            '_'
        ),
        weekdays: '昔왽�昔��昔긍칾昔긍칮昔뺖칾昔뺖�昔닮�晳�_昔ㅰ�昔쇸칾昔뺖츪晳띭츜昔욈�昔�칷_昔싟칳昔듀칾昔듀�昔�칾昔뺖�昔닮�晳�_昔む칮昔ㅰ�晳띭츜昔욈�昔�칷_昔듀�昔��昔닮츜晳띭츜昔욈�昔�칷_昔듀칳昔녀칾昔녀�昔뺖칾昔뺖�昔닮�晳�_昔싟�昔욈츜晳띭츜昔욈�昔�칷'.split(
            '_'
        ),
        weekdaysShort: '昔왽�昔��昔긍칮_昔ㅰ�昔쇸칾昔뺖�晳�_昔싟칳昔듀칾昔듀�昔�칾_昔む칮昔ㅰ�晳�_昔듀�昔��昔닮�晳�_昔듀칳昔녀칾昔녀�_昔싟�昔�'.split(
            '_'
        ),
        weekdaysMin: '昔왽�_昔ㅰ�_昔싟칳_昔む칮_昔듀�_昔듀칳_昔�'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY, HH:mm',
            LLLL: 'dddd, D MMMM YYYY, HH:mm',
        },
        calendar: {
            sameDay: '[昔뉋�晳띭�晳�] LT',
            nextDay: '[昔ⓣ�昔녀칷] LT',
            nextWeek: 'dddd, LT',
            lastDay: '[昔ⓣ칶昔긍칾昔긍칮] LT',
            lastWeek: '[昔뺖츪昔ⓣ칾昔� 昔듀�昔겯�晳�] dddd, LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s 昔뉋�晳�',
            past: '%s 昔�칮昔⒯칾',
            s: '昔믞�晳� 昔싟�昔� 昔듀�昔ⓣ�昔잀�昔뺖�晳�',
            ss: '%d 昔듀�昔ⓣ�昔잀�昔뺖�晳�',
            m: '昔믞�晳� 昔ⓣ�昔��昔잀�晳�',
            mm: '%d 昔ⓣ�昔��昔잀츢晳띭츜昔녀칾',
            h: '昔믞�晳� 昔��昔� 昔ⓣ칶昔겯�晳�',
            hh: '%d 昔��昔� 昔ⓣ칶昔겯�晳�',
            d: '昔믞�晳� 昔ⓣ�昔녀칾',
            dd: '%d 昔ⓣ�昔잀칾昔뺖�晳�',
            M: '昔믞�晳� 昔��昔ㅰ�晳�',
            MM: '%d 昔��昔ㅰ츢晳띭츜昔녀칾',
            y: '昔믞�晳� 昔듀�晳곟츪昔�칾',
            yy: '%d 昔녱�晳띭츪晳곟츜昔녀칾',
        },
        dayOfMonthOrdinalParse: /\d{1,2}昔듀�晳�/,
        ordinal: function (number) {
            return number + '昔듀�晳�';
        },
        preparse: function (string) {
            return string.replace(/[晳㏅�晳⒯�晳ム�晳��晳��]/g, function (match) {
                return numberMap$f[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap$g[match];
            });
        },
        // refer http://ta.wikipedia.org/s/1er1
        meridiemParse: /昔��昔��晳�|昔듀칷昔뺖�晳�|昔뺖�昔꿋칷|昔ⓣ�晳띭�昔뺖�晳�|昔롞�晳띭�昔약츪晳�|昔��昔꿋칷/,
        meridiem: function (hour, minute, isLower) {
            if (hour < 2) {
                return ' 昔��昔��晳�';
            } else if (hour < 6) {
                return ' 昔듀칷昔뺖�晳�'; // 昔듀칷昔뺖�晳�
            } else if (hour < 10) {
                return ' 昔뺖�昔꿋칷'; // 昔뺖�昔꿋칷
            } else if (hour < 14) {
                return ' 昔ⓣ�晳띭�昔뺖�晳�'; // 昔ⓣ�晳띭�昔뺖�晳�
            } else if (hour < 18) {
                return ' 昔롞�晳띭�昔약츪晳�'; // 昔롞�晳띭�昔약츪晳�
            } else if (hour < 22) {
                return ' 昔��昔꿋칷'; // 昔��昔꿋칷
            } else {
                return ' 昔��昔��晳�';
            }
        },
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '昔��昔��晳�') {
                return hour < 2 ? hour : hour + 12;
            } else if (meridiem === '昔듀칷昔뺖�晳�' || meridiem === '昔뺖�昔꿋칷') {
                return hour;
            } else if (meridiem === '昔ⓣ�晳띭�昔뺖�晳�') {
                return hour >= 10 ? hour : hour + 12;
            } else {
                return hour + 12;
            }
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 6, // The week that contains Jan 6th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('te', {
        months: '析쒉감析듀같析�_析ム걀析о콑析겯갠析겯걀_析�갼析겯콑析싟걀_析뤲값汐띭같析욈갛汐�_析�콋_析쒉콆析ⓣ콑_析쒉콅析꿋콌_析녱컱析멘콑析잀콅_析멘콊析む콑析잀콊析귖갔析겯콑_析끶컯汐띭컾汐뗠갔析겯콑_析ⓣ갠析귖갔析겯콑_析□걀析멘콊析귖갔析겯콑'.split(
            '_'
        ),
        monthsShort: '析쒉감._析ム걀析о콑析�._析�갼析겯콑析싟걀_析뤲값汐띭같析�._析�콋_析쒉콆析ⓣ콑_析쒉콅析꿋콌_析녱컱._析멘콊析む콑._析끶컯汐띭컾汐�._析ⓣ갠._析□걀析멘콊.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: '析녱갉析욈갠析약같析�_析멘콏析�갠析약같析�_析�컗析쀠개析듀갼析겯컗_析о콅析㏅갠析약같析�_析쀠콅析겯콅析듀갼析겯컗_析뜩콅析뺖콑析겯갠析약같析�_析뜩감析욈갠析약같析�'.split(
            '_'
        ),
        weekdaysShort: '析녱갉析�_析멘콏析�_析�컗析쀠개_析о콅析�_析쀠콅析겯콅_析뜩콅析뺖콑析�_析뜩감析�'.split('_'),
        weekdaysMin: '析�_析멘콏_析�컗_析о콅_析쀠콅_析뜩콅_析�'.split('_'),
        longDateFormat: {
            LT: 'A h:mm',
            LTS: 'A h:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY, A h:mm',
            LLLL: 'dddd, D MMMM YYYY, A h:mm',
        },
        calendar: {
            sameDay: '[析ⓣ콋析□콅] LT',
            nextDay: '[析겯콋析む콅] LT',
            nextWeek: 'dddd, LT',
            lastDay: '[析ⓣ걀析ⓣ콑析�] LT',
            lastWeek: '[析쀠갇] dddd, LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s 析꿋콏',
            past: '%s 析뺖콑析겯걀析ㅰ컗',
            s: '析뺖콎析ⓣ콑析ⓣ걀 析뺖콑析룅간析약갛汐�',
            ss: '%d 析멘콊析뺖감汐띭갛汐�',
            m: '析믞컯 析ⓣ걀析�걀析룅컗',
            mm: '%d 析ⓣ걀析�걀析룅갼析꿋콅',
            h: '析믞컯 析쀠컗析�',
            hh: '%d 析쀠컗析잀갛汐�',
            d: '析믞컯 析겯콏析쒉콅',
            dd: '%d 析겯콏析쒉콅析꿋콅',
            M: '析믞컯 析ⓣ콊析�',
            MM: '%d 析ⓣ콊析꿋갛汐�',
            y: '析믞컯 析멘컗析듀갇汐띭갭析겯컗',
            yy: '%d 析멘컗析듀갇汐띭갭析겯갼析꿋콅',
        },
        dayOfMonthOrdinalParse: /\d{1,2}析�/,
        ordinal: '%d析�',
        meridiemParse: /析겯갼析ㅰ콑析겯걀|析됢갉析�컗|析�갊汐띭갗析약갯汐띭감析�|析멘갼析�컗析ㅰ콑析겯컗/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '析겯갼析ㅰ콑析겯걀') {
                return hour < 4 ? hour : hour + 12;
            } else if (meridiem === '析됢갉析�컗') {
                return hour;
            } else if (meridiem === '析�갊汐띭갗析약갯汐띭감析�') {
                return hour >= 10 ? hour : hour + 12;
            } else if (meridiem === '析멘갼析�컗析ㅰ콑析겯컗') {
                return hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 4) {
                return '析겯갼析ㅰ콑析겯걀';
            } else if (hour < 10) {
                return '析됢갉析�컗';
            } else if (hour < 17) {
                return '析�갊汐띭갗析약갯汐띭감析�';
            } else if (hour < 20) {
                return '析멘갼析�컗析ㅰ콑析겯컗';
            } else {
                return '析겯갼析ㅰ콑析겯걀';
            }
        },
        week: {
            dow: 0, // Sunday is the first day of the week.
            doy: 6, // The week that contains Jan 6th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('tet', {
        months: 'Janeiru_Fevereiru_Marsu_Abril_Maiu_Ju챰u_Jullu_Agustu_Setembru_Outubru_Novembru_Dezembru'.split(
            '_'
        ),
        monthsShort: 'Jan_Fev_Mar_Abr_Mai_Jun_Jul_Ago_Set_Out_Nov_Dez'.split('_'),
        weekdays: 'Domingu_Segunda_Tersa_Kuarta_Kinta_Sesta_Sabadu'.split('_'),
        weekdaysShort: 'Dom_Seg_Ters_Kua_Kint_Sest_Sab'.split('_'),
        weekdaysMin: 'Do_Seg_Te_Ku_Ki_Ses_Sa'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[Ohin iha] LT',
            nextDay: '[Aban iha] LT',
            nextWeek: 'dddd [iha] LT',
            lastDay: '[Horiseik iha] LT',
            lastWeek: 'dddd [semana kotuk] [iha] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'iha %s',
            past: '%s liuba',
            s: 'segundu balun',
            ss: 'segundu %d',
            m: 'minutu ida',
            mm: 'minutu %d',
            h: 'oras ida',
            hh: 'oras %d',
            d: 'loron ida',
            dd: 'loron %d',
            M: 'fulan ida',
            MM: 'fulan %d',
            y: 'tinan ida',
            yy: 'tinan %d',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal: function (number) {
            var b = number % 10,
                output =
                    ~~((number % 100) / 10) === 1
                        ? 'th'
                        : b === 1
                            ? 'st'
                            : b === 2
                                ? 'nd'
                                : b === 3
                                    ? 'rd'
                                    : 'th';
            return number + output;
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var suffixes$3 = {
        0: '-�劇',
        1: '-�劇',
        2: '-�劇',
        3: '-�劇',
        4: '-�劇',
        5: '-�劇',
        6: '-�劇',
        7: '-�劇',
        8: '-�劇',
        9: '-�劇',
        10: '-�劇',
        12: '-�劇',
        13: '-�劇',
        20: '-�劇',
        30: '-�劇',
        40: '-�劇',
        50: '-�劇',
        60: '-�劇',
        70: '-�劇',
        80: '-�劇',
        90: '-�劇',
        100: '-�劇',
    };

    hooks.defineLocale('tg', {
        months: {
            format: '�戟勻逵�龜_�筠勻�逵剋龜_劇逵��龜_逵極�筠剋龜_劇逵橘龜_龜�戟龜_龜�剋龜_逵勻均���龜_�筠戟��閨�龜_棘克��閨�龜_戟棘�閨�龜_畇筠克逵閨�龜'.split(
                '_'
            ),
            standalone: '�戟勻逵�_�筠勻�逵剋_劇逵��_逵極�筠剋_劇逵橘_龜�戟_龜�剋_逵勻均���_�筠戟��閨�_棘克��閨�_戟棘�閨�_畇筠克逵閨�'.split(
                '_'
            ),
        },
        monthsShort: '�戟勻_�筠勻_劇逵�_逵極�_劇逵橘_龜�戟_龜�剋_逵勻均_�筠戟_棘克�_戟棘�_畇筠克'.split('_'),
        weekdays: '�克�逵戟閨筠_畇��逵戟閨筠_�筠�逵戟閨筠_�棘��逵戟閨筠_極逵戟念�逵戟閨筠_念�劇�逵_�逵戟閨筠'.split(
            '_'
        ),
        weekdaysShort: '��閨_畇�閨_��閨_��閨_極�閨_念�劇_�戟閨'.split('_'),
        weekdaysMin: '��_畇�_��_��_極�_念劇_�閨'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[�劇�簞鈞 �棘逵�龜] LT',
            nextDay: '[圭逵�畇棘 �棘逵�龜] LT',
            lastDay: '[�龜�簞鈞 �棘逵�龜] LT',
            nextWeek: 'dddd[龜] [女逵��逵龜 棘�戟畇逵 �棘逵�龜] LT',
            lastWeek: 'dddd[龜] [女逵��逵龜 均�鈞逵��逵 �棘逵�龜] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '閨逵�畇龜 %s',
            past: '%s 極筠�',
            s: '�克�逵戟畇 �棘戟龜�',
            m: '�克 畇逵�龜�逵',
            mm: '%d 畇逵�龜�逵',
            h: '�克 �棘逵�',
            hh: '%d �棘逵�',
            d: '�克 �簞鈞',
            dd: '%d �簞鈞',
            M: '�克 劇棘女',
            MM: '%d 劇棘女',
            y: '�克 �棘剋',
            yy: '%d �棘剋',
        },
        meridiemParse: /�逵閨|��閨女|�簞鈞|閨筠均棘女/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '�逵閨') {
                return hour < 4 ? hour : hour + 12;
            } else if (meridiem === '��閨女') {
                return hour;
            } else if (meridiem === '�簞鈞') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === '閨筠均棘女') {
                return hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 4) {
                return '�逵閨';
            } else if (hour < 11) {
                return '��閨女';
            } else if (hour < 16) {
                return '�簞鈞';
            } else if (hour < 19) {
                return '閨筠均棘女';
            } else {
                return '�逵閨';
            }
        },
        dayOfMonthOrdinalParse: /\d{1,2}-(�劇|�劇)/,
        ordinal: function (number) {
            var a = number % 10,
                b = number >= 100 ? 100 : null;
            return number + (suffixes$3[number] || suffixes$3[a] || suffixes$3[b]);
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 1th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('th', {
        months: '錫□툈錫｀림錫꾝륫_錫곟만錫□툩錫꿋툧錫긍툢錫섁퉴_錫□링錫쇸림錫꾝륫_仙�錫□릇錫꿋륭錫�_錫왽륵錫⒯툩錫꿋툌錫�_錫□릿錫뽤만錫쇸림錫№툢_錫곟르錫곟툗錫꿋툌錫�_錫む릿錫뉋릊錫꿋툌錫�_錫곟릴錫쇸륭錫꿋륭錫�_錫뺖만錫�림錫꾝륫_錫왽륵錫ⓣ툑錫닮툈錫꿋륭錫�_錫섁릴錫쇸름錫꿋툌錫�'.split(
            '_'
        ),
        monthsShort: '錫�.錫�._錫�.錫�._錫□링.錫�._仙�錫�.錫�._錫�.錫�._錫□릿.錫�._錫�.錫�._錫�.錫�._錫�.錫�._錫�.錫�._錫�.錫�._錫�.錫�.'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: '錫�림錫쀠릿錫뺖륭仙�_錫댽릴錫쇸툠錫｀퉴_錫�릴錫뉋툌錫꿋르_錫왽만錫�_錫왽륵錫ム릴錫む툣錫붲링_錫ⓣ만錫곟르仙�_仙�錫む림錫｀퉴'.split('_'),
        weekdaysShort: '錫�림錫쀠릿錫뺖륭仙�_錫댽릴錫쇸툠錫｀퉴_錫�릴錫뉋툌錫꿋르_錫왽만錫�_錫왽륵錫ム릴錫�_錫ⓣ만錫곟르仙�_仙�錫む림錫｀퉴'.split('_'), // yes, three characters difference
        weekdaysMin: '錫�림._錫�._錫�._錫�._錫왽륵._錫�._錫�.'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'H:mm',
            LTS: 'H:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY 仙�錫㏅른錫� H:mm',
            LLLL: '錫㏅릴錫셝ddd錫쀠링仙� D MMMM YYYY 仙�錫㏅른錫� H:mm',
        },
        meridiemParse: /錫곟퉰錫�툢仙�錫쀠링仙댽륭錫�|錫ム른錫긍툏仙�錫쀠링仙댽륭錫�/,
        isPM: function (input) {
            return input === '錫ム른錫긍툏仙�錫쀠링仙댽륭錫�';
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 12) {
                return '錫곟퉰錫�툢仙�錫쀠링仙댽륭錫�';
            } else {
                return '錫ム른錫긍툏仙�錫쀠링仙댽륭錫�';
            }
        },
        calendar: {
            sameDay: '[錫㏅릴錫쇸툢錫듀퉱 仙�錫㏅른錫�] LT',
            nextDay: '[錫왽르錫멘퉰錫뉋툢錫듀퉱 仙�錫㏅른錫�] LT',
            nextWeek: 'dddd[錫ム툢仙됢림 仙�錫㏅른錫�] LT',
            lastDay: '[仙�錫□막仙댽릎錫㏅림錫쇸툢錫듀퉱 仙�錫㏅른錫�] LT',
            lastWeek: '[錫㏅릴錫�]dddd[錫쀠링仙댽퉩錫�퉱錫� 仙�錫㏅른錫�] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '錫�링錫� %s',
            past: '%s錫쀠링仙댽퉩錫�퉱錫�',
            s: '仙꾝륫仙댽툈錫듀퉰錫㏅릿錫쇸림錫쀠링',
            ss: '%d 錫㏅릿錫쇸림錫쀠링',
            m: '1 錫쇸림錫쀠링',
            mm: '%d 錫쇸림錫쀠링',
            h: '1 錫듺릴仙댽름仙귖륫錫�',
            hh: '%d 錫듺릴仙댽름仙귖륫錫�',
            d: '1 錫㏅릴錫�',
            dd: '%d 錫㏅릴錫�',
            w: '1 錫む릴錫쎹툝錫꿋릊仙�',
            ww: '%d 錫む릴錫쎹툝錫꿋릊仙�',
            M: '1 仙�錫붲막錫�툢',
            MM: '%d 仙�錫붲막錫�툢',
            y: '1 錫쎹링',
            yy: '%d 錫쎹링',
        },
    });

    //! moment.js locale configuration

    var suffixes$4 = {
        1: "'inji",
        5: "'inji",
        8: "'inji",
        70: "'inji",
        80: "'inji",
        2: "'nji",
        7: "'nji",
        20: "'nji",
        50: "'nji",
        3: "'체nji",
        4: "'체nji",
        100: "'체nji",
        6: "'njy",
        9: "'unjy",
        10: "'unjy",
        30: "'unjy",
        60: "'ynjy",
        90: "'ynjy",
    };

    hooks.defineLocale('tk', {
        months: '횦anwar_Fewral_Mart_Aprel_Ma첵_I첵un_I첵ul_Awgust_Sent첵abr_Okt첵abr_No첵abr_Dekabr'.split(
            '_'
        ),
        monthsShort: '횦an_Few_Mar_Apr_Ma첵_I첵n_I첵l_Awg_Sen_Okt_No첵_Dek'.split('_'),
        weekdays: '횦ek힊enbe_Du힊enbe_Si힊enbe_횉ar힊enbe_Pen힊enbe_Anna_힇enbe'.split(
            '_'
        ),
        weekdaysShort: '횦ek_Du힊_Si힊_횉ar_Pen_Ann_힇en'.split('_'),
        weekdaysMin: '횦k_D힊_S힊_횉r_Pn_An_힇n'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[bug체n sagat] LT',
            nextDay: '[ertir sagat] LT',
            nextWeek: '[indiki] dddd [sagat] LT',
            lastDay: '[d체첵n] LT',
            lastWeek: '[ge챌en] dddd [sagat] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s so흫',
            past: '%s 철흫',
            s: 'birn채챌e sekunt',
            m: 'bir minut',
            mm: '%d minut',
            h: 'bir sagat',
            hh: '%d sagat',
            d: 'bir g체n',
            dd: '%d g체n',
            M: 'bir a첵',
            MM: '%d a첵',
            y: 'bir 첵yl',
            yy: '%d 첵yl',
        },
        ordinal: function (number, period) {
            switch (period) {
                case 'd':
                case 'D':
                case 'Do':
                case 'DD':
                    return number;
                default:
                    if (number === 0) {
                        // special case for zero
                        return number + "'unjy";
                    }
                    var a = number % 10,
                        b = (number % 100) - a,
                        c = number >= 100 ? 100 : null;
                    return number + (suffixes$4[a] || suffixes$4[b] || suffixes$4[c]);
            }
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('tl-ph', {
        months: 'Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre'.split(
            '_'
        ),
        monthsShort: 'Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis'.split('_'),
        weekdays: 'Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado'.split(
            '_'
        ),
        weekdaysShort: 'Lin_Lun_Mar_Miy_Huw_Biy_Sab'.split('_'),
        weekdaysMin: 'Li_Lu_Ma_Mi_Hu_Bi_Sab'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'MM/D/YYYY',
            LL: 'MMMM D, YYYY',
            LLL: 'MMMM D, YYYY HH:mm',
            LLLL: 'dddd, MMMM DD, YYYY HH:mm',
        },
        calendar: {
            sameDay: 'LT [ngayong araw]',
            nextDay: '[Bukas ng] LT',
            nextWeek: 'LT [sa susunod na] dddd',
            lastDay: 'LT [kahapon]',
            lastWeek: 'LT [noong nakaraang] dddd',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'sa loob ng %s',
            past: '%s ang nakalipas',
            s: 'ilang segundo',
            ss: '%d segundo',
            m: 'isang minuto',
            mm: '%d minuto',
            h: 'isang oras',
            hh: '%d oras',
            d: 'isang araw',
            dd: '%d araw',
            M: 'isang buwan',
            MM: '%d buwan',
            y: 'isang taon',
            yy: '%d taon',
        },
        dayOfMonthOrdinalParse: /\d{1,2}/,
        ordinal: function (number) {
            return number;
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var numbersNouns = 'pagh_wa��_cha��_wej_loS_vagh_jav_Soch_chorgh_Hut'.split('_');

    function translateFuture(output) {
        var time = output;
        time =
            output.indexOf('jaj') !== -1
                ? time.slice(0, -3) + 'leS'
                : output.indexOf('jar') !== -1
                    ? time.slice(0, -3) + 'waQ'
                    : output.indexOf('DIS') !== -1
                        ? time.slice(0, -3) + 'nem'
                        : time + ' pIq';
        return time;
    }

    function translatePast(output) {
        var time = output;
        time =
            output.indexOf('jaj') !== -1
                ? time.slice(0, -3) + 'Hu��'
                : output.indexOf('jar') !== -1
                    ? time.slice(0, -3) + 'wen'
                    : output.indexOf('DIS') !== -1
                        ? time.slice(0, -3) + 'ben'
                        : time + ' ret';
        return time;
    }

    function translate$a(number, withoutSuffix, string, isFuture) {
        var numberNoun = numberAsNoun(number);
        switch (string) {
            case 'ss':
                return numberNoun + ' lup';
            case 'mm':
                return numberNoun + ' tup';
            case 'hh':
                return numberNoun + ' rep';
            case 'dd':
                return numberNoun + ' jaj';
            case 'MM':
                return numberNoun + ' jar';
            case 'yy':
                return numberNoun + ' DIS';
        }
    }

    function numberAsNoun(number) {
        var hundred = Math.floor((number % 1000) / 100),
            ten = Math.floor((number % 100) / 10),
            one = number % 10,
            word = '';
        if (hundred > 0) {
            word += numbersNouns[hundred] + 'vatlh';
        }
        if (ten > 0) {
            word += (word !== '' ? ' ' : '') + numbersNouns[ten] + 'maH';
        }
        if (one > 0) {
            word += (word !== '' ? ' ' : '') + numbersNouns[one];
        }
        return word === '' ? 'pagh' : word;
    }

    hooks.defineLocale('tlh', {
        months: 'tera�� jar wa��_tera�� jar cha��_tera�� jar wej_tera�� jar loS_tera�� jar vagh_tera�� jar jav_tera�� jar Soch_tera�� jar chorgh_tera�� jar Hut_tera�� jar wa�셫aH_tera�� jar wa�셫aH wa��_tera�� jar wa�셫aH cha��'.split(
            '_'
        ),
        monthsShort: 'jar wa��_jar cha��_jar wej_jar loS_jar vagh_jar jav_jar Soch_jar chorgh_jar Hut_jar wa�셫aH_jar wa�셫aH wa��_jar wa�셫aH cha��'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj'.split(
            '_'
        ),
        weekdaysShort: 'lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj'.split(
            '_'
        ),
        weekdaysMin: 'lojmItjaj_DaSjaj_povjaj_ghItlhjaj_loghjaj_buqjaj_ghInjaj'.split(
            '_'
        ),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[DaHjaj] LT',
            nextDay: '[wa�셪eS] LT',
            nextWeek: 'LLL',
            lastDay: '[wa�섽u��] LT',
            lastWeek: 'LLL',
            sameElse: 'L',
        },
        relativeTime: {
            future: translateFuture,
            past: translatePast,
            s: 'puS lup',
            ss: translate$a,
            m: 'wa�� tup',
            mm: translate$a,
            h: 'wa�� rep',
            hh: translate$a,
            d: 'wa�� jaj',
            dd: translate$a,
            M: 'wa�� jar',
            MM: translate$a,
            y: 'wa�� DIS',
            yy: translate$a,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var suffixes$5 = {
        1: "'inci",
        5: "'inci",
        8: "'inci",
        70: "'inci",
        80: "'inci",
        2: "'nci",
        7: "'nci",
        20: "'nci",
        50: "'nci",
        3: "'체nc체",
        4: "'체nc체",
        100: "'체nc체",
        6: "'nc캇",
        9: "'uncu",
        10: "'uncu",
        30: "'uncu",
        60: "'캇nc캇",
        90: "'캇nc캇",
    };

    hooks.defineLocale('tr', {
        months: 'Ocak_힇ubat_Mart_Nisan_May캇s_Haziran_Temmuz_A휓ustos_Eyl체l_Ekim_Kas캇m_Aral캇k'.split(
            '_'
        ),
        monthsShort: 'Oca_힇ub_Mar_Nis_May_Haz_Tem_A휓u_Eyl_Eki_Kas_Ara'.split('_'),
        weekdays: 'Pazar_Pazartesi_Sal캇_횉ar힊amba_Per힊embe_Cuma_Cumartesi'.split(
            '_'
        ),
        weekdaysShort: 'Paz_Pts_Sal_횉ar_Per_Cum_Cts'.split('_'),
        weekdaysMin: 'Pz_Pt_Sa_횉a_Pe_Cu_Ct'.split('_'),
        meridiem: function (hours, minutes, isLower) {
            if (hours < 12) {
                return isLower ? '철철' : '횜횜';
            } else {
                return isLower ? '철s' : '횜S';
            }
        },
        meridiemParse: /철철|횜횜|철s|횜S/,
        isPM: function (input) {
            return input === '철s' || input === '횜S';
        },
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[bug체n saat] LT',
            nextDay: '[yar캇n saat] LT',
            nextWeek: '[gelecek] dddd [saat] LT',
            lastDay: '[d체n] LT',
            lastWeek: '[ge챌en] dddd [saat] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s sonra',
            past: '%s 철nce',
            s: 'birka챌 saniye',
            ss: '%d saniye',
            m: 'bir dakika',
            mm: '%d dakika',
            h: 'bir saat',
            hh: '%d saat',
            d: 'bir g체n',
            dd: '%d g체n',
            w: 'bir hafta',
            ww: '%d hafta',
            M: 'bir ay',
            MM: '%d ay',
            y: 'bir y캇l',
            yy: '%d y캇l',
        },
        ordinal: function (number, period) {
            switch (period) {
                case 'd':
                case 'D':
                case 'Do':
                case 'DD':
                    return number;
                default:
                    if (number === 0) {
                        // special case for zero
                        return number + "'캇nc캇";
                    }
                    var a = number % 10,
                        b = (number % 100) - a,
                        c = number >= 100 ? 100 : null;
                    return number + (suffixes$5[a] || suffixes$5[b] || suffixes$5[c]);
            }
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    // After the year there should be a slash and the amount of years since December 26, 1979 in Roman numerals.
    // This is currently too difficult (maybe even impossible) to add.
    hooks.defineLocale('tzl', {
        months: 'Januar_Fevraglh_Mar챌_Avr챦u_Mai_G체n_Julia_Guscht_Setemvar_Listop채ts_Noemvar_Zecemvar'.split(
            '_'
        ),
        monthsShort: 'Jan_Fev_Mar_Avr_Mai_G체n_Jul_Gus_Set_Lis_Noe_Zec'.split('_'),
        weekdays: 'S첬ladi_L첬ne챌i_Maitzi_M찼rcuri_Xh첬adi_Vi챕ner챌i_S찼turi'.split('_'),
        weekdaysShort: 'S첬l_L첬n_Mai_M찼r_Xh첬_Vi챕_S찼t'.split('_'),
        weekdaysMin: 'S첬_L첬_Ma_M찼_Xh_Vi_S찼'.split('_'),
        longDateFormat: {
            LT: 'HH.mm',
            LTS: 'HH.mm.ss',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM [dallas] YYYY',
            LLL: 'D. MMMM [dallas] YYYY HH.mm',
            LLLL: 'dddd, [li] D. MMMM [dallas] YYYY HH.mm',
        },
        meridiemParse: /d\'o|d\'a/i,
        isPM: function (input) {
            return "d'o" === input.toLowerCase();
        },
        meridiem: function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? "d'o" : "D'O";
            } else {
                return isLower ? "d'a" : "D'A";
            }
        },
        calendar: {
            sameDay: '[oxhi 횪] LT',
            nextDay: '[dem횪 횪] LT',
            nextWeek: 'dddd [횪] LT',
            lastDay: '[ieiri 횪] LT',
            lastWeek: '[s체r el] dddd [lasteu 횪] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'osprei %s',
            past: 'ja%s',
            s: processRelativeTime$8,
            ss: processRelativeTime$8,
            m: processRelativeTime$8,
            mm: processRelativeTime$8,
            h: processRelativeTime$8,
            hh: processRelativeTime$8,
            d: processRelativeTime$8,
            dd: processRelativeTime$8,
            M: processRelativeTime$8,
            MM: processRelativeTime$8,
            y: processRelativeTime$8,
            yy: processRelativeTime$8,
        },
        dayOfMonthOrdinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    function processRelativeTime$8(number, withoutSuffix, key, isFuture) {
        var format = {
            s: ['viensas secunds', "'iensas secunds"],
            ss: [number + ' secunds', '' + number + ' secunds'],
            m: ["'n m챠ut", "'iens m챠ut"],
            mm: [number + ' m챠uts', '' + number + ' m챠uts'],
            h: ["'n 첸ora", "'iensa 첸ora"],
            hh: [number + ' 첸oras', '' + number + ' 첸oras'],
            d: ["'n ziua", "'iensa ziua"],
            dd: [number + ' ziuas', '' + number + ' ziuas'],
            M: ["'n mes", "'iens mes"],
            MM: [number + ' mesen', '' + number + ' mesen'],
            y: ["'n ar", "'iens ar"],
            yy: [number + ' ars', '' + number + ' ars'],
        };
        return isFuture
            ? format[key][0]
            : withoutSuffix
                ? format[key][0]
                : format[key][1];
    }

    //! moment.js locale configuration

    hooks.defineLocale('tzm-latn', {
        months: 'innayr_br胛ayr胛_mar胛s胛_ibrir_mayyw_ywnyw_ywlywz_�w큄t_큄wtanbir_kt胛wbr胛_nwwanbir_dwjnbir'.split(
            '_'
        ),
        monthsShort: 'innayr_br胛ayr胛_mar胛s胛_ibrir_mayyw_ywnyw_ywlywz_�w큄t_큄wtanbir_kt胛wbr胛_nwwanbir_dwjnbir'.split(
            '_'
        ),
        weekdays: 'asamas_aynas_asinas_akras_akwas_asimwas_asi搔뛹as'.split('_'),
        weekdaysShort: 'asamas_aynas_asinas_akras_akwas_asimwas_asi搔뛹as'.split('_'),
        weekdaysMin: 'asamas_aynas_asinas_akras_akwas_asimwas_asi搔뛹as'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[asdkh g] LT',
            nextDay: '[aska g] LT',
            nextWeek: 'dddd [g] LT',
            lastDay: '[assant g] LT',
            lastWeek: 'dddd [g] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'dadkh s yan %s',
            past: 'yan %s',
            s: 'imik',
            ss: '%d imik',
            m: 'minu搔�',
            mm: '%d minu搔�',
            h: 'sa�a',
            hh: '%d tassa�in',
            d: 'ass',
            dd: '%d ossan',
            M: 'ayowr',
            MM: '%d iyyirn',
            y: 'asgas',
            yy: '%d isgasn',
        },
        week: {
            dow: 6, // Saturday is the first day of the week.
            doy: 12, // The week that contains Jan 12th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('tzm', {
        months: '竪됤탲竪뤴눗竪™탷_穗기탹穗겸덩竪�_竪롡눗竪뺚탾_竪됤눙竪붴탧竪�_竪롡눗竪™덩竪�_竪™탶竪뤴덩竪�_竪™탶竪띯덩竪볛덫_竪뽦탶竪쎻턀_竪쎻탶竪쒋눗竪뤴눙竪됤탷_穗썩턃竪볛눙竪�_竪뤴탶竪△눗竪뤴눙竪됤탷_穗룐탶竪듼탲穗기탧竪�'.split(
            '_'
        ),
        monthsShort: '竪됤탲竪뤴눗竪™탷_穗기탹穗겸덩竪�_竪롡눗竪뺚탾_竪됤눙竪붴탧竪�_竪롡눗竪™덩竪�_竪™탶竪뤴덩竪�_竪™탶竪띯덩竪볛덫_竪뽦탶竪쎻턀_竪쎻탶竪쒋눗竪뤴눙竪됤탷_穗썩턃竪볛눙竪�_竪뤴탶竪△눗竪뤴눙竪됤탷_穗룐탶竪듼탲穗기탧竪�'.split(
            '_'
        ),
        weekdays: '穗겸탽穗겸탮穗겸탽_穗겸덩竪뤴눗竪�_穗겸탽竪됤탲穗겸탽_穗겸늄竪붴눗竪�_穗겸늄竪△눗竪�_穗겸탽竪됤탮竪△눗竪�_穗겸탽竪됤뉩竪™눗竪�'.split('_'),
        weekdaysShort: '穗겸탽穗겸탮穗겸탽_穗겸덩竪뤴눗竪�_穗겸탽竪됤탲穗겸탽_穗겸늄竪붴눗竪�_穗겸늄竪△눗竪�_穗겸탽竪됤탮竪△눗竪�_穗겸탽竪됤뉩竪™눗竪�'.split('_'),
        weekdaysMin: '穗겸탽穗겸탮穗겸탽_穗겸덩竪뤴눗竪�_穗겸탽竪됤탲穗겸탽_穗겸늄竪붴눗竪�_穗겸늄竪△눗竪�_穗겸탽竪됤탮竪△눗竪�_穗겸탽竪됤뉩竪™눗竪�'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[穗겸탽穗룐탢 穗�] LT',
            nextDay: '[穗겸탽穗썩눗 穗�] LT',
            nextWeek: 'dddd [穗�] LT',
            lastDay: '[穗겸탾穗겸탲竪� 穗�] LT',
            lastWeek: 'dddd [穗�] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '穗룐눗穗룐탢 竪� 竪™눗竪� %s',
            past: '竪™눗竪� %s',
            s: '竪됤탮竪됤늄',
            ss: '%d 竪됤탮竪됤늄',
            m: '竪롡탧竪뤴탶穗�',
            mm: '%d 竪롡탧竪뤴탶穗�',
            h: '竪쇺눗竪꾟눗',
            hh: '%d 竪쒋눗竪쇺탽穗겸탡竪됤탲',
            d: '穗겸탽竪�',
            dd: '%d o竪쇺탽穗겸탲',
            M: '穗겸덩o竪볛탷',
            MM: '%d 竪됤덩竪™탧竪붴탲',
            y: '穗겸탽穗년눗竪�',
            yy: '%d 竪됤탽穗년눗竪쇺탲',
        },
        week: {
            dow: 6, // Saturday is the first day of the week.
            doy: 12, // The week that contains Jan 12th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('ug-cn', {
        months: '�碼��碼邈_���邈碼�_�碼邈魔_痲碼毛邈��_�碼�_痲����_痲����_痲碼�曼�卍魔_卍��魔�磨�邈_痲��魔�磨�邈_���碼磨�邈_膜��碼磨�邈'.split(
            '_'
        ),
        monthsShort: '�碼��碼邈_���邈碼�_�碼邈魔_痲碼毛邈��_�碼�_痲����_痲����_痲碼�曼�卍魔_卍��魔�磨�邈_痲��魔�磨�邈_���碼磨�邈_膜��碼磨�邈'.split(
            '_'
        ),
        weekdays: '���娩��磨�_膜�娩��磨�_卍��娩��磨�_�碼邈娩��磨�_毛��娩��磨�_寞���_娩��磨�'.split(
            '_'
        ),
        weekdaysShort: '��_膜�_卍�_�碼_毛�_寞�_娩�'.split('_'),
        weekdaysMin: '��_膜�_卍�_�碼_毛�_寞�_娩�'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'YYYY-MM-DD',
            LL: 'YYYY-����M-痲碼���尾D-����',
            LLL: 'YYYY-����M-痲碼���尾D-����� HH:mm',
            LLLL: 'dddd� YYYY-����M-痲碼���尾D-����� HH:mm',
        },
        meridiemParse: /��邈�� ����|卍�岷�邈|��娩魔�� 磨�邈��|��娩|��娩魔�� �����|���/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (
                meridiem === '��邈�� ����' ||
                meridiem === '卍�岷�邈' ||
                meridiem === '��娩魔�� 磨�邈��'
            ) {
                return hour;
            } else if (meridiem === '��娩魔�� �����' || meridiem === '���') {
                return hour + 12;
            } else {
                return hour >= 11 ? hour : hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            var hm = hour * 100 + minute;
            if (hm < 600) {
                return '��邈�� ����';
            } else if (hm < 900) {
                return '卍�岷�邈';
            } else if (hm < 1130) {
                return '��娩魔�� 磨�邈��';
            } else if (hm < 1230) {
                return '��娩';
            } else if (hm < 1800) {
                return '��娩魔�� �����';
            } else {
                return '���';
            }
        },
        calendar: {
            sameDay: '[磨�彌�� 卍碼痲�魔] LT',
            nextDay: '[痲�魔� 卍碼痲�魔] LT',
            nextWeek: '[����邈��] dddd [卍碼痲�魔] LT',
            lastDay: '[魔���彌��] LT',
            lastWeek: '[痲碼�膜����] dddd [卍碼痲�魔] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s �����',
            past: '%s 磨�邈��',
            s: '����� 卍����魔',
            ss: '%d 卍����魔',
            m: '磨�邈 ����魔',
            mm: '%d ����魔',
            h: '磨�邈 卍碼痲�魔',
            hh: '%d 卍碼痲�魔',
            d: '磨�邈 ���',
            dd: '%d ���',
            M: '磨�邈 痲碼�',
            MM: '%d 痲碼�',
            y: '磨�邈 ���',
            yy: '%d ���',
        },

        dayOfMonthOrdinalParse: /\d{1,2}(-����|-痲碼�|-岷�毛魔�)/,
        ordinal: function (number, period) {
            switch (period) {
                case 'd':
                case 'D':
                case 'DDD':
                    return number + '-����';
                case 'w':
                case 'W':
                    return number + '-岷�毛魔�';
                default:
                    return number;
            }
        },
        preparse: function (string) {
            return string.replace(/�/g, ',');
        },
        postformat: function (string) {
            return string.replace(/,/g, '�');
        },
        week: {
            // GB/T 7408-1994�딀빊��뀇�뚥벡�€졏凉뤒룝에��벡�◈룡뿥�잌뭽�띌뿴烏①ㅊ力뺛�뗤툗ISO 8601:1988嶺됪븞
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 1st is the first week of the year.
        },
    });

    //! moment.js locale configuration

    function plural$6(word, num) {
        var forms = word.split('_');
        return num % 10 === 1 && num % 100 !== 11
            ? forms[0]
            : num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20)
                ? forms[1]
                : forms[2];
    }
    function relativeTimeWithPlural$4(number, withoutSuffix, key) {
        var format = {
            ss: withoutSuffix ? '�筠克�戟畇逵_�筠克�戟畇龜_�筠克�戟畇' : '�筠克�戟畇�_�筠克�戟畇龜_�筠克�戟畇',
            mm: withoutSuffix ? '�勻龜剋龜戟逵_�勻龜剋龜戟龜_�勻龜剋龜戟' : '�勻龜剋龜戟�_�勻龜剋龜戟龜_�勻龜剋龜戟',
            hh: withoutSuffix ? '均棘畇龜戟逵_均棘畇龜戟龜_均棘畇龜戟' : '均棘畇龜戟�_均棘畇龜戟龜_均棘畇龜戟',
            dd: '畇筠戟�_畇戟�_畇戟�勻',
            MM: '劇�����_劇�����_劇�����勻',
            yy: '��克_�棘克龜_�棘克�勻',
        };
        if (key === 'm') {
            return withoutSuffix ? '�勻龜剋龜戟逵' : '�勻龜剋龜戟�';
        } else if (key === 'h') {
            return withoutSuffix ? '均棘畇龜戟逵' : '均棘畇龜戟�';
        } else {
            return number + ' ' + plural$6(format[key], +number);
        }
    }
    function weekdaysCaseReplace(m, format) {
        var weekdays = {
                nominative: '戟筠畇�剋�_極棘戟筠畇�剋棘克_勻�勻�棘�棘克_�筠�筠畇逵_�筠�勻筠�_極�쇥뤣궿싻먈녢�_��閨棘�逵'.split(
                    '_'
                ),
                accusative: '戟筠畇�剋�_極棘戟筠畇�剋棘克_勻�勻�棘�棘克_�筠�筠畇�_�筠�勻筠�_極�쇥뤣궿싻먈녢�_��閨棘��'.split(
                    '_'
                ),
                genitive: '戟筠畇�剋�_極棘戟筠畇�剋克逵_勻�勻�棘�克逵_�筠�筠畇龜_�筠�勻筠�均逵_極�쇥뤣궿싻먈녢�_��閨棘�龜'.split(
                    '_'
                ),
            },
            nounCase;

        if (m === true) {
            return weekdays['nominative']
                .slice(1, 7)
                .concat(weekdays['nominative'].slice(0, 1));
        }
        if (!m) {
            return weekdays['nominative'];
        }

        nounCase = /(\[[�勻叫�]\]) ?dddd/.test(format)
            ? 'accusative'
            : /\[?(?:劇龜戟�剋棘�|戟逵���極戟棘�)? ?\] ?dddd/.test(format)
                ? 'genitive'
                : 'nominative';
        return weekdays[nounCase][m.day()];
    }
    function processHoursFunction(str) {
        return function () {
            return str + '棘' + (this.hours() === 11 ? '閨' : '') + '] LT';
        };
    }

    hooks.defineLocale('uk', {
        months: {
            format: '���戟�_剋��棘均棘_閨筠�筠鈞戟�_克勻��戟�_��逵勻戟�_�筠�勻戟�_剋龜極戟�_�筠�極戟�_勻筠�筠�戟�_菌棘勻�戟�_剋龜��棘極逵畇逵_均��畇戟�'.split(
                '_'
            ),
            standalone: '���筠戟�_剋��龜橘_閨筠�筠鈞筠戟�_克勻��筠戟�_��逵勻筠戟�_�筠�勻筠戟�_剋龜極筠戟�_�筠�極筠戟�_勻筠�筠�筠戟�_菌棘勻�筠戟�_剋龜��棘極逵畇_均��畇筠戟�'.split(
                '_'
            ),
        },
        monthsShort: '���_剋��_閨筠�_克勻��_��逵勻_�筠�勻_剋龜極_�筠�極_勻筠�_菌棘勻�_剋龜��_均��畇'.split(
            '_'
        ),
        weekdays: weekdaysCaseReplace,
        weekdaysShort: '戟畇_極戟_勻�_��_��_極�_�閨'.split('_'),
        weekdaysMin: '戟畇_極戟_勻�_��_��_極�_�閨'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD.MM.YYYY',
            LL: 'D MMMM YYYY �.',
            LLL: 'D MMMM YYYY �., HH:mm',
            LLLL: 'dddd, D MMMM YYYY �., HH:mm',
        },
        calendar: {
            sameDay: processHoursFunction('[鬼�棘均棘畇戟� '),
            nextDay: processHoursFunction('[�逵勻��逵 '),
            lastDay: processHoursFunction('[��棘�逵 '),
            nextWeek: processHoursFunction('[叫] dddd ['),
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                    case 3:
                    case 5:
                    case 6:
                        return processHoursFunction('[�龜戟�剋棘�] dddd [').call(this);
                    case 1:
                    case 2:
                    case 4:
                        return processHoursFunction('[�龜戟�剋棘均棘] dddd [').call(this);
                }
            },
            sameElse: 'L',
        },
        relativeTime: {
            future: '鈞逵 %s',
            past: '%s �棘劇�',
            s: '畇筠克�剋�克逵 �筠克�戟畇',
            ss: relativeTimeWithPlural$4,
            m: relativeTimeWithPlural$4,
            mm: relativeTimeWithPlural$4,
            h: '均棘畇龜戟�',
            hh: relativeTimeWithPlural$4,
            d: '畇筠戟�',
            dd: relativeTimeWithPlural$4,
            M: '劇�����',
            MM: relativeTimeWithPlural$4,
            y: '��克',
            yy: relativeTimeWithPlural$4,
        },
        // M. E.: those two are virtually unused but a user might want to implement them for his/her website for some reason
        meridiemParse: /戟棘��|�逵戟克�|畇戟�|勻筠�棘�逵/,
        isPM: function (input) {
            return /^(畇戟�|勻筠�棘�逵)$/.test(input);
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 4) {
                return '戟棘��';
            } else if (hour < 12) {
                return '�逵戟克�';
            } else if (hour < 17) {
                return '畇戟�';
            } else {
                return '勻筠�棘�逵';
            }
        },
        dayOfMonthOrdinalParse: /\d{1,2}-(橘|均棘)/,
        ordinal: function (number, period) {
            switch (period) {
                case 'M':
                case 'd':
                case 'DDD':
                case 'w':
                case 'W':
                    return number + '-橘';
                case 'D':
                    return number + '-均棘';
                default:
                    return number;
            }
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    var months$b = [
            '寞��邈�',
            '�邈�邈�',
            '�碼邈�',
            '碼毛邈��',
            '�痲�',
            '寞��',
            '寞��碼痲�',
            '碼彌卍魔',
            '卍魔�磨邈',
            '碼沕魔�磨邈',
            '���磨邈',
            '膜卍�磨邈',
        ],
        days$2 = ['碼魔�碼邈', '毛�邈', '��彌�', '磨膜岷', '寞�晩邈碼魔', '寞�晩�', '��魔�'];

    hooks.defineLocale('ur', {
        months: months$b,
        monthsShort: months$b,
        weekdays: days$2,
        weekdaysShort: days$2,
        weekdaysMin: days$2,
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd� D MMMM YYYY HH:mm',
        },
        meridiemParse: /巒磨幕|娩碼�/,
        isPM: function (input) {
            return '娩碼�' === input;
        },
        meridiem: function (hour, minute, isLower) {
            if (hour < 12) {
                return '巒磨幕';
            }
            return '娩碼�';
        },
        calendar: {
            sameDay: '[笠寞 磨��魔] LT',
            nextDay: '[沕� 磨��魔] LT',
            nextWeek: 'dddd [磨��魔] LT',
            lastDay: '[彌莫娩魔� 邈�万 磨��魔] LT',
            lastWeek: '[彌莫娩魔�] dddd [磨��魔] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s 磨晩膜',
            past: '%s �磨�',
            s: '��膜 卍�沕��',
            ss: '%d 卍�沕��',
            m: '碼�沕 ��摹',
            mm: '%d ��摹',
            h: '碼�沕 彌岷�摹�',
            hh: '%d 彌岷�摹�',
            d: '碼�沕 膜�',
            dd: '%d 膜�',
            M: '碼�沕 �碼�',
            MM: '%d �碼�',
            y: '碼�沕 卍碼�',
            yy: '%d 卍碼�',
        },
        preparse: function (string) {
            return string.replace(/�/g, ',');
        },
        postformat: function (string) {
            return string.replace(/,/g, '�');
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('uz-latn', {
        months: 'Yanvar_Fevral_Mart_Aprel_May_Iyun_Iyul_Avgust_Sentabr_Oktabr_Noyabr_Dekabr'.split(
            '_'
        ),
        monthsShort: 'Yan_Fev_Mar_Apr_May_Iyun_Iyul_Avg_Sen_Okt_Noy_Dek'.split('_'),
        weekdays: 'Yakshanba_Dushanba_Seshanba_Chorshanba_Payshanba_Juma_Shanba'.split(
            '_'
        ),
        weekdaysShort: 'Yak_Dush_Sesh_Chor_Pay_Jum_Shan'.split('_'),
        weekdaysMin: 'Ya_Du_Se_Cho_Pa_Ju_Sha'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'D MMMM YYYY, dddd HH:mm',
        },
        calendar: {
            sameDay: '[Bugun soat] LT [da]',
            nextDay: '[Ertaga] LT [da]',
            nextWeek: 'dddd [kuni soat] LT [da]',
            lastDay: '[Kecha soat] LT [da]',
            lastWeek: "[O'tgan] dddd [kuni soat] LT [da]",
            sameElse: 'L',
        },
        relativeTime: {
            future: 'Yaqin %s ichida',
            past: 'Bir necha %s oldin',
            s: 'soniya',
            ss: '%d soniya',
            m: 'bir daqiqa',
            mm: '%d daqiqa',
            h: 'bir soat',
            hh: '%d soat',
            d: 'bir kun',
            dd: '%d kun',
            M: 'bir oy',
            MM: '%d oy',
            y: 'bir yil',
            yy: '%d yil',
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 7th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('uz', {
        months: '�戟勻逵�_�筠勻�逵剋_劇逵��_逵極�筠剋_劇逵橘_龜�戟_龜�剋_逵勻均���_�筠戟��閨�_棘克��閨�_戟棘�閨�_畇筠克逵閨�'.split(
            '_'
        ),
        monthsShort: '�戟勻_�筠勻_劇逵�_逵極�_劇逵橘_龜�戟_龜�剋_逵勻均_�筠戟_棘克�_戟棘�_畇筠克'.split('_'),
        weekdays: '赳克�逵戟閨逵_���逵戟閨逵_鬼筠�逵戟閨逵_槻棘��逵戟閨逵_�逵橘�逵戟閨逵_��劇逵_珪逵戟閨逵'.split('_'),
        weekdaysShort: '赳克�_���_鬼筠�_槻棘�_�逵橘_��劇_珪逵戟'.split('_'),
        weekdaysMin: '赳克_��_鬼筠_槻棘_�逵_��_珪逵'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'D MMMM YYYY, dddd HH:mm',
        },
        calendar: {
            sameDay: '[��均�戟 �棘逵�] LT [畇逵]',
            nextDay: '[葵��逵均逵] LT [畇逵]',
            nextWeek: 'dddd [克�戟龜 �棘逵�] LT [畇逵]',
            lastDay: '[�筠�逵 �棘逵�] LT [畇逵]',
            lastWeek: '[叫�均逵戟] dddd [克�戟龜 �棘逵�] LT [畇逵]',
            sameElse: 'L',
        },
        relativeTime: {
            future: '赳克龜戟 %s 龜�龜畇逵',
            past: '�龜� 戟筠�逵 %s 棘剋畇龜戟',
            s: '����逵�',
            ss: '%d ����逵�',
            m: '閨龜� 畇逵克龜克逵',
            mm: '%d 畇逵克龜克逵',
            h: '閨龜� �棘逵�',
            hh: '%d �棘逵�',
            d: '閨龜� 克�戟',
            dd: '%d 克�戟',
            M: '閨龜� 棘橘',
            MM: '%d 棘橘',
            y: '閨龜� 橘龜剋',
            yy: '%d 橘龜剋',
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 7, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('vi', {
        months: 'th찼ng 1_th찼ng 2_th찼ng 3_th찼ng 4_th찼ng 5_th찼ng 6_th찼ng 7_th찼ng 8_th찼ng 9_th찼ng 10_th찼ng 11_th찼ng 12'.split(
            '_'
        ),
        monthsShort: 'Thg 01_Thg 02_Thg 03_Thg 04_Thg 05_Thg 06_Thg 07_Thg 08_Thg 09_Thg 10_Thg 11_Thg 12'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'ch沼� nh梳춗_th沼� hai_th沼� ba_th沼� t튼_th沼� n훱m_th沼� s찼u_th沼� b梳즭'.split(
            '_'
        ),
        weekdaysShort: 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
        weekdaysMin: 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
        weekdaysParseExact: true,
        meridiemParse: /sa|ch/i,
        isPM: function (input) {
            return /^ch$/i.test(input);
        },
        meridiem: function (hours, minutes, isLower) {
            if (hours < 12) {
                return isLower ? 'sa' : 'SA';
            } else {
                return isLower ? 'ch' : 'CH';
            }
        },
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM [n훱m] YYYY',
            LLL: 'D MMMM [n훱m] YYYY HH:mm',
            LLLL: 'dddd, D MMMM [n훱m] YYYY HH:mm',
            l: 'DD/M/YYYY',
            ll: 'D MMM YYYY',
            lll: 'D MMM YYYY HH:mm',
            llll: 'ddd, D MMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[H척m nay l첬c] LT',
            nextDay: '[Ng횪y mai l첬c] LT',
            nextWeek: 'dddd [tu梳쬷 t沼쌻 l첬c] LT',
            lastDay: '[H척m qua l첬c] LT',
            lastWeek: 'dddd [tu梳쬷 tr튼沼쌵 l첬c] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '%s t沼쌻',
            past: '%s tr튼沼쌵',
            s: 'v횪i gi창y',
            ss: '%d gi창y',
            m: 'm沼셳 ph첬t',
            mm: '%d ph첬t',
            h: 'm沼셳 gi沼�',
            hh: '%d gi沼�',
            d: 'm沼셳 ng횪y',
            dd: '%d ng횪y',
            w: 'm沼셳 tu梳쬷',
            ww: '%d tu梳쬷',
            M: 'm沼셳 th찼ng',
            MM: '%d th찼ng',
            y: 'm沼셳 n훱m',
            yy: '%d n훱m',
        },
        dayOfMonthOrdinalParse: /\d{1,2}/,
        ordinal: function (number) {
            return number;
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('x-pseudo', {
        months: 'J~찼챰첬찼~r첵_F~챕br첬~찼r첵_~M찼rc~h_횁p~r챠l_~M찼첵_~J첬챰챕~_J첬l~첵_횁첬~g첬st~_S챕p~t챕mb~챕r_횙~ct처b~챕r_횗~처v챕m~b챕r_~D챕c챕~mb챕r'.split(
            '_'
        ),
        monthsShort: 'J~찼챰_~F챕b_~M찼r_~횁pr_~M찼첵_~J첬챰_~J첬l_~횁첬g_~S챕p_~횙ct_~횗처v_~D챕c'.split(
            '_'
        ),
        monthsParseExact: true,
        weekdays: 'S~첬챰d찼~첵_M처~챰d찼첵~_T첬챕~sd찼첵~_W챕d~챰챕sd~찼첵_T~h첬rs~d찼첵_~Fr챠d~찼첵_S~찼t첬r~d찼첵'.split(
            '_'
        ),
        weekdaysShort: 'S~첬챰_~M처챰_~T첬챕_~W챕d_~Th첬_~Fr챠_~S찼t'.split('_'),
        weekdaysMin: 'S~첬_M처~_T첬_~W챕_T~h_Fr~_S찼'.split('_'),
        weekdaysParseExact: true,
        longDateFormat: {
            LT: 'HH:mm',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY HH:mm',
            LLLL: 'dddd, D MMMM YYYY HH:mm',
        },
        calendar: {
            sameDay: '[T~처d찼~첵 찼t] LT',
            nextDay: '[T~처m처~rr처~w 찼t] LT',
            nextWeek: 'dddd [찼t] LT',
            lastDay: '[횦~챕st~챕rd찼~첵 찼t] LT',
            lastWeek: '[L~찼st] dddd [찼t] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: '챠~챰 %s',
            past: '%s 찼~g처',
            s: '찼 ~f챕w ~s챕c처~챰ds',
            ss: '%d s~챕c처챰~ds',
            m: '찼 ~m챠챰~첬t챕',
            mm: '%d m~챠챰첬~t챕s',
            h: '찼~챰 h처~첬r',
            hh: '%d h~처첬rs',
            d: '찼 ~d찼첵',
            dd: '%d d~찼첵s',
            M: '찼 ~m처챰~th',
            MM: '%d m~처챰t~hs',
            y: '찼 ~첵챕찼r',
            yy: '%d 첵~챕찼rs',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal: function (number) {
            var b = number % 10,
                output =
                    ~~((number % 100) / 10) === 1
                        ? 'th'
                        : b === 1
                            ? 'st'
                            : b === 2
                                ? 'nd'
                                : b === 3
                                    ? 'rd'
                                    : 'th';
            return number + output;
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('yo', {
        months: 'S梳미걊梳미�_E�re�le�_梳퇾梳미�na�_I�gbe�_E�bibi_O�ku�du_Ag梳퉙o_O�gu�n_Owewe_沼뚉�wa�ra�_Be�lu�_沼뚉�p梳미��'.split(
            '_'
        ),
        monthsShort: 'S梳미걊_E�rl_梳퇾n_I�gb_E�bi_O�ku�_Ag梳�_O�gu�_Owe_沼뚉�wa�_Be�l_沼뚉�p梳미��'.split('_'),
        weekdays: 'A�i�ku�_Aje�_I�s梳미갾un_沼똨沼띖걊u�_沼똨沼띖갶沼�_梳툀i�_A�ba�m梳미걎a'.split('_'),
        weekdaysShort: 'A�i�k_Aje�_I�s梳미�_沼똨r_沼똨b_梳툀i�_A�ba�'.split('_'),
        weekdaysMin: 'A�i�_Aj_I�s_沼똱_沼똟_梳툀_A�b'.split('_'),
        longDateFormat: {
            LT: 'h:mm A',
            LTS: 'h:mm:ss A',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY h:mm A',
            LLLL: 'dddd, D MMMM YYYY h:mm A',
        },
        calendar: {
            sameDay: '[O�ni� ni] LT',
            nextDay: '[沼뚉�la ni] LT',
            nextWeek: "dddd [沼똲梳미� to�n'b沼�] [ni] LT",
            lastDay: '[A�na ni] LT',
            lastWeek: 'dddd [沼똲梳미� to�l沼띖�] [ni] LT',
            sameElse: 'L',
        },
        relativeTime: {
            future: 'ni� %s',
            past: '%s k沼뛧a�',
            s: 'i�s梳퉖u� aaya� die',
            ss: 'aaya� %d',
            m: 'i�s梳퉖u� kan',
            mm: 'i�s梳퉖u� %d',
            h: 'wa�kati kan',
            hh: 'wa�kati %d',
            d: '沼뛧沼띖� kan',
            dd: '沼뛧沼띖� %d',
            M: 'osu� kan',
            MM: 'osu� %d',
            y: '沼뛡u�n kan',
            yy: '沼뛡u�n %d',
        },
        dayOfMonthOrdinalParse: /沼뛧沼띖�\s\d{1,2}/,
        ordinal: '沼뛧沼띖� %d',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('zh-cn', {
        months: '訝���_雅뚧쐢_訝됪쐢_�쎿쐢_雅붹쐢_��쐢_訝껅쐢_�ユ쐢_阿앮쐢_�곫쐢_�곦���_�곦틠��'.split(
            '_'
        ),
        monthsShort: '1��_2��_3��_4��_5��_6��_7��_8��_9��_10��_11��_12��'.split(
            '_'
        ),
        weekdays: '�잍쐿��_�잍쐿訝�_�잍쐿雅�_�잍쐿訝�_�잍쐿��_�잍쐿雅�_�잍쐿��'.split('_'),
        weekdaysShort: '�ⓩ뿥_�ⓧ�_�ⓧ틠_�ⓧ툒_�ⓨ썪_�ⓧ틪_�ⓨ뀷'.split('_'),
        weekdaysMin: '��_訝�_雅�_訝�_��_雅�_��'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'YYYY/MM/DD',
            LL: 'YYYY亮퀾�뉲��',
            LLL: 'YYYY亮퀾�뉲�쩇h�퉙m��',
            LLLL: 'YYYY亮퀾�뉲�쩮dddAh�퉙m��',
            l: 'YYYY/M/D',
            ll: 'YYYY亮퀾�뉲��',
            lll: 'YYYY亮퀾�뉲�� HH:mm',
            llll: 'YYYY亮퀾�뉲�쩮ddd HH:mm',
        },
        meridiemParse: /�뚧솳|�⒳툓|訝듿뜄|訝�뜄|訝뗥뜄|�싦툓/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '�뚧솳' || meridiem === '�⒳툓' || meridiem === '訝듿뜄') {
                return hour;
            } else if (meridiem === '訝뗥뜄' || meridiem === '�싦툓') {
                return hour + 12;
            } else {
                // '訝�뜄'
                return hour >= 11 ? hour : hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            var hm = hour * 100 + minute;
            if (hm < 600) {
                return '�뚧솳';
            } else if (hm < 900) {
                return '�⒳툓';
            } else if (hm < 1130) {
                return '訝듿뜄';
            } else if (hm < 1230) {
                return '訝�뜄';
            } else if (hm < 1800) {
                return '訝뗥뜄';
            } else {
                return '�싦툓';
            }
        },
        calendar: {
            sameDay: '[餓듿ㄹ]LT',
            nextDay: '[�롥ㄹ]LT',
            nextWeek: function (now) {
                if (now.week() !== this.week()) {
                    return '[訝�]dddLT';
                } else {
                    return '[��]dddLT';
                }
            },
            lastDay: '[�ⓨㄹ]LT',
            lastWeek: function (now) {
                if (this.week() !== now.week()) {
                    return '[訝�]dddLT';
                } else {
                    return '[��]dddLT';
                }
            },
            sameElse: 'L',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(��|��|��)/,
        ordinal: function (number, period) {
            switch (period) {
                case 'd':
                case 'D':
                case 'DDD':
                    return number + '��';
                case 'M':
                    return number + '��';
                case 'w':
                case 'W':
                    return number + '��';
                default:
                    return number;
            }
        },
        relativeTime: {
            future: '%s��',
            past: '%s��',
            s: '�좂쭜',
            ss: '%d 燁�',
            m: '1 �녽뮓',
            mm: '%d �녽뮓',
            h: '1 弱뤸뿶',
            hh: '%d 弱뤸뿶',
            d: '1 鸚�',
            dd: '%d 鸚�',
            w: '1 ��',
            ww: '%d ��',
            M: '1 訝ゆ쐢',
            MM: '%d 訝ゆ쐢',
            y: '1 亮�',
            yy: '%d 亮�',
        },
        week: {
            // GB/T 7408-1994�딀빊��뀇�뚥벡�€졏凉뤒룝에��벡�◈룡뿥�잌뭽�띌뿴烏①ㅊ力뺛�뗤툗ISO 8601:1988嶺됪븞
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('zh-hk', {
        months: '訝���_雅뚧쐢_訝됪쐢_�쎿쐢_雅붹쐢_��쐢_訝껅쐢_�ユ쐢_阿앮쐢_�곫쐢_�곦���_�곦틠��'.split(
            '_'
        ),
        monthsShort: '1��_2��_3��_4��_5��_6��_7��_8��_9��_10��_11��_12��'.split(
            '_'
        ),
        weekdays: '�잍쐿��_�잍쐿訝�_�잍쐿雅�_�잍쐿訝�_�잍쐿��_�잍쐿雅�_�잍쐿��'.split('_'),
        weekdaysShort: '�길뿥_�긴�_�긴틠_�긴툒_�긷썪_�긴틪_�긷뀷'.split('_'),
        weekdaysMin: '��_訝�_雅�_訝�_��_雅�_��'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'YYYY/MM/DD',
            LL: 'YYYY亮퀾�뉲��',
            LLL: 'YYYY亮퀾�뉲�� HH:mm',
            LLLL: 'YYYY亮퀾�뉲�쩮ddd HH:mm',
            l: 'YYYY/M/D',
            ll: 'YYYY亮퀾�뉲��',
            lll: 'YYYY亮퀾�뉲�� HH:mm',
            llll: 'YYYY亮퀾�뉲�쩮ddd HH:mm',
        },
        meridiemParse: /�뚧솳|�⒳툓|訝듿뜄|訝�뜄|訝뗥뜄|�싦툓/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '�뚧솳' || meridiem === '�⒳툓' || meridiem === '訝듿뜄') {
                return hour;
            } else if (meridiem === '訝�뜄') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === '訝뗥뜄' || meridiem === '�싦툓') {
                return hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            var hm = hour * 100 + minute;
            if (hm < 600) {
                return '�뚧솳';
            } else if (hm < 900) {
                return '�⒳툓';
            } else if (hm < 1200) {
                return '訝듿뜄';
            } else if (hm === 1200) {
                return '訝�뜄';
            } else if (hm < 1800) {
                return '訝뗥뜄';
            } else {
                return '�싦툓';
            }
        },
        calendar: {
            sameDay: '[餓듿ㄹ]LT',
            nextDay: '[�롥ㄹ]LT',
            nextWeek: '[訝�]ddddLT',
            lastDay: '[�ⓨㄹ]LT',
            lastWeek: '[訝�]ddddLT',
            sameElse: 'L',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(��|��|��)/,
        ordinal: function (number, period) {
            switch (period) {
                case 'd':
                case 'D':
                case 'DDD':
                    return number + '��';
                case 'M':
                    return number + '��';
                case 'w':
                case 'W':
                    return number + '��';
                default:
                    return number;
            }
        },
        relativeTime: {
            future: '%s孃�',
            past: '%s��',
            s: '亮양쭜',
            ss: '%d 燁�',
            m: '1 �녽릺',
            mm: '%d �녽릺',
            h: '1 弱뤸셽',
            hh: '%d 弱뤸셽',
            d: '1 鸚�',
            dd: '%d 鸚�',
            M: '1 �뗦쐢',
            MM: '%d �뗦쐢',
            y: '1 亮�',
            yy: '%d 亮�',
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('zh-mo', {
        months: '訝���_雅뚧쐢_訝됪쐢_�쎿쐢_雅붹쐢_��쐢_訝껅쐢_�ユ쐢_阿앮쐢_�곫쐢_�곦���_�곦틠��'.split(
            '_'
        ),
        monthsShort: '1��_2��_3��_4��_5��_6��_7��_8��_9��_10��_11��_12��'.split(
            '_'
        ),
        weekdays: '�잍쐿��_�잍쐿訝�_�잍쐿雅�_�잍쐿訝�_�잍쐿��_�잍쐿雅�_�잍쐿��'.split('_'),
        weekdaysShort: '�길뿥_�긴�_�긴틠_�긴툒_�긷썪_�긴틪_�긷뀷'.split('_'),
        weekdaysMin: '��_訝�_雅�_訝�_��_雅�_��'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'YYYY亮퀾�뉲��',
            LLL: 'YYYY亮퀾�뉲�� HH:mm',
            LLLL: 'YYYY亮퀾�뉲�쩮ddd HH:mm',
            l: 'D/M/YYYY',
            ll: 'YYYY亮퀾�뉲��',
            lll: 'YYYY亮퀾�뉲�� HH:mm',
            llll: 'YYYY亮퀾�뉲�쩮ddd HH:mm',
        },
        meridiemParse: /�뚧솳|�⒳툓|訝듿뜄|訝�뜄|訝뗥뜄|�싦툓/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '�뚧솳' || meridiem === '�⒳툓' || meridiem === '訝듿뜄') {
                return hour;
            } else if (meridiem === '訝�뜄') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === '訝뗥뜄' || meridiem === '�싦툓') {
                return hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            var hm = hour * 100 + minute;
            if (hm < 600) {
                return '�뚧솳';
            } else if (hm < 900) {
                return '�⒳툓';
            } else if (hm < 1130) {
                return '訝듿뜄';
            } else if (hm < 1230) {
                return '訝�뜄';
            } else if (hm < 1800) {
                return '訝뗥뜄';
            } else {
                return '�싦툓';
            }
        },
        calendar: {
            sameDay: '[餓듿ㄹ] LT',
            nextDay: '[�롥ㄹ] LT',
            nextWeek: '[訝�]dddd LT',
            lastDay: '[�ⓨㄹ] LT',
            lastWeek: '[訝�]dddd LT',
            sameElse: 'L',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(��|��|��)/,
        ordinal: function (number, period) {
            switch (period) {
                case 'd':
                case 'D':
                case 'DDD':
                    return number + '��';
                case 'M':
                    return number + '��';
                case 'w':
                case 'W':
                    return number + '��';
                default:
                    return number;
            }
        },
        relativeTime: {
            future: '%s��',
            past: '%s��',
            s: '亮양쭜',
            ss: '%d 燁�',
            m: '1 �녽릺',
            mm: '%d �녽릺',
            h: '1 弱뤸셽',
            hh: '%d 弱뤸셽',
            d: '1 鸚�',
            dd: '%d 鸚�',
            M: '1 �뗦쐢',
            MM: '%d �뗦쐢',
            y: '1 亮�',
            yy: '%d 亮�',
        },
    });

    //! moment.js locale configuration

    hooks.defineLocale('zh-tw', {
        months: '訝���_雅뚧쐢_訝됪쐢_�쎿쐢_雅붹쐢_��쐢_訝껅쐢_�ユ쐢_阿앮쐢_�곫쐢_�곦���_�곦틠��'.split(
            '_'
        ),
        monthsShort: '1��_2��_3��_4��_5��_6��_7��_8��_9��_10��_11��_12��'.split(
            '_'
        ),
        weekdays: '�잍쐿��_�잍쐿訝�_�잍쐿雅�_�잍쐿訝�_�잍쐿��_�잍쐿雅�_�잍쐿��'.split('_'),
        weekdaysShort: '�길뿥_�긴�_�긴틠_�긴툒_�긷썪_�긴틪_�긷뀷'.split('_'),
        weekdaysMin: '��_訝�_雅�_訝�_��_雅�_��'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'YYYY/MM/DD',
            LL: 'YYYY亮퀾�뉲��',
            LLL: 'YYYY亮퀾�뉲�� HH:mm',
            LLLL: 'YYYY亮퀾�뉲�쩮ddd HH:mm',
            l: 'YYYY/M/D',
            ll: 'YYYY亮퀾�뉲��',
            lll: 'YYYY亮퀾�뉲�� HH:mm',
            llll: 'YYYY亮퀾�뉲�쩮ddd HH:mm',
        },
        meridiemParse: /�뚧솳|�⒳툓|訝듿뜄|訝�뜄|訝뗥뜄|�싦툓/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '�뚧솳' || meridiem === '�⒳툓' || meridiem === '訝듿뜄') {
                return hour;
            } else if (meridiem === '訝�뜄') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === '訝뗥뜄' || meridiem === '�싦툓') {
                return hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            var hm = hour * 100 + minute;
            if (hm < 600) {
                return '�뚧솳';
            } else if (hm < 900) {
                return '�⒳툓';
            } else if (hm < 1130) {
                return '訝듿뜄';
            } else if (hm < 1230) {
                return '訝�뜄';
            } else if (hm < 1800) {
                return '訝뗥뜄';
            } else {
                return '�싦툓';
            }
        },
        calendar: {
            sameDay: '[餓듿ㄹ] LT',
            nextDay: '[�롥ㄹ] LT',
            nextWeek: '[訝�]dddd LT',
            lastDay: '[�ⓨㄹ] LT',
            lastWeek: '[訝�]dddd LT',
            sameElse: 'L',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(��|��|��)/,
        ordinal: function (number, period) {
            switch (period) {
                case 'd':
                case 'D':
                case 'DDD':
                    return number + '��';
                case 'M':
                    return number + '��';
                case 'w':
                case 'W':
                    return number + '��';
                default:
                    return number;
            }
        },
        relativeTime: {
            future: '%s孃�',
            past: '%s��',
            s: '亮양쭜',
            ss: '%d 燁�',
            m: '1 �녽릺',
            mm: '%d �녽릺',
            h: '1 弱뤸셽',
            hh: '%d 弱뤸셽',
            d: '1 鸚�',
            dd: '%d 鸚�',
            M: '1 �뗦쐢',
            MM: '%d �뗦쐢',
            y: '1 亮�',
            yy: '%d 亮�',
        },
    });

    hooks.locale('en');

    return hooks;

})));