module.exports = {
    add_brackets: add_brackets,
    subtract_brackets: subtract_brackets,
    taxes_owed: taxes_owed,
    marginal_rate: marginal_rate,
    effective_rate: effective_rate,
}


function add_brackets(a, b) {
    var i = 0;
    var j = 0;

    var result = [];

    while (i < a.length && j < b.length) {
        if (a[i][0] < b[j][0]) {
            if (a[i][0] !== Infinity) {
                result.push([a[i][0], a[i][1] + b[j][1]]);
            }
            i++;
        } else {
            if (b[j][0] !== Infinity) {
                result.push([b[j][0], a[i][1] + b[j][1]]);
            }
            j++;
        }
    }

    for (; i < a.length; i++) {
        result.push(a[i]);
        if (b[b.length - 1][0] === Infinity) {
            result[result.length - 1][1] += b[b.length - 1][1];
        }
    }

    for (; j < b.length; j++) {
        result.push(b[j]);
        if (a[a.length - 1][0] === Infinity) {
            result[result.length - 1][1] += a[a.length - 1][1];
        }
    }

    return result;
}


function subtract_brackets(a, b) {
    var i = 0;
    var j = 0;

    var result = [];

    while (i < a.length && j < b.length) {
        if (a[i][0] < b[j][0]) {
            result.push([a[i][0], a[i][1] - b[j][1]]);
            i++;
        } else {
            result.push([b[j][0], a[i][1] - b[j][1]]);
            j++;
        }
    }

    for (; i < a.length; i++) {
        result.push(a[i]);
    }

    for (; j < b.length; j++) {
        result.push(b[j]);
    }

    return result;
}


function taxes_owed(income, brackets) {
    var owed = 0;
    var lower_end = 0;

    for (var i in brackets) {
        if (income > brackets[i][0]) {
            owed += (brackets[i][0] - lower_end) * brackets[i][1];
            lower_end = brackets[i][0];
        } else {
            owed += (income - lower_end) * brackets[i][1];
            break;
        }
    }

    return owed;
}


function marginal_rate(income, brackets) {
    for (var i in brackets) {
        if (income < brackets[i][0]) {
            return brackets[i][1];
        }
    }

    return 0;
}


function effective_rate(income, brackets) {
    if (income === 0) {
        return 0;
    }
    return taxes_owed(income, brackets) / income;
}