var x = 0
var op

function oprt(x, y) {
    if (op == 2){
        return parseFloat(x) + parseFloat(y)
    }
    else if (op == 3){
        return x - y
    }
    else if (op == 4){
        return multiply(x)
    }
    else{
        if (x == 0){
            return 1 / y
        }
        else if (y == 0){
            return 'Nulou sa nedelí'
        }
        else{
            return x / y
        }
    }
}

function multiply(y) {
    if (x == 0) {
        x = y
        return x
    }
    else {
        x *= y
        return x
    }

}

function rectangle(a, b) {
    circ = (2 * a) + (2 * b)
    cont = a * b
    return "Obvod = " + circ + " Obsah = " + cont

}

//function drop() {
//    document.getElementById("myDropdown").classList.toggle("show");
//}

function myFunction() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
        x.className += " responsive";
    } else {
        x.className = "topnav";
    }
}

function bmi(a, b) {
    b = parseFloat(b)
    a /= 100
    return (b) / (a ** 2)
}
function bmi_hlt(a) {
    if (a > 0 && a < 18.5) {
        document.getElementById('pdv').style.color='#FF0000';
    }
    else if (a >= 18.5 && a <= 24.9) {
        document.getElementById('nmm').style.color='#FF0000';
    }
    else if (a >= 25 && a <= 29.9) {
        document.getElementById('nm').style.color='#FF0000';
    }
    else if (a >= 30 && a <= 34.9) {
        document.getElementById('ofs').style.color='#FF0000';
    }
    else if (a >= 35 && a <= 39.9) {
        document.getElementById('oss').style.color='#FF0000';
    }
    else if (a > 40) {
        document.getElementById('ots').style.color='#FF0000';
    }
}

function calcm() {
    var mode = document.getElementById("mode");
    var slct = mode.options[mode.selectedIndex].value;
    if (slct === 'pl') {
        document.getElementById('mlt').innerHTML = ('');
        document.getElementById('fst').style.visibility = 'visible';
        document.getElementById('scnd').style.visibility = 'visible';
        document.getElementById('rob').style.visibility = 'visible';
        op = 2;
    }

    else if (slct === 'mi')  {
        document.getElementById('mlt').innerHTML = ('');
        document.getElementById('fst').style.visibility = 'visible';
        document.getElementById('scnd').style.visibility = 'visible';
        document.getElementById('rob').style.visibility = 'visible';
        op = 3;
    }

    else if (slct === 'ti') {
        document.getElementById('mlt').innerHTML = ('');
        document.getElementById('fst').style.visibility = 'visible';
        document.getElementById('scnd').style.visibility = 'hidden';
        document.getElementById('rob').style.visibility = 'visible';
        op = 4;
    }

    else if (slct === 'di') {
        document.getElementById('mlt').innerHTML = ('');
        document.getElementById('fst').style.visibility = 'visible';
        document.getElementById('scnd').style.visibility = 'visible';
        document.getElementById('rob').style.visibility = 'visible';
        op = 5;
    }

    else {
        document.getElementById('mlt').innerHTML = ('Vyber si operáciu');
        document.getElementById('fst').style.visibility = 'hidden';
        document.getElementById('scnd').style.visibility = 'hidden';
        document.getElementById('rob').style.visibility = 'hidden';
        op = 1;
    }
}