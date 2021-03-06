/*
    <SmartCalc-web web version of SmartCalc.>
    Copyright (C) <2018>  <Filip Holčík>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/


let x = 1;
let op;
let par;

function oprt(x, y) {
    if (op === 2){
        return parseFloat(x) + parseFloat(y)
    }
    else if (op === 3){
        return x - y
    }
    else if (op === 4){
        document.getElementById('fst').value = '';
        return multiply(x);
    }
    else if (op === 5){
        if (x === 0){
            return 1 / y
        }
        else if (y === 0){
            return 'Nulou sa nedelí'
        }
        else{
            return x / y
        }
    }
    else if (par === 6) {
        return x  ** y
    }
    else if (par === 7) {
        let s;
        for (s = 0; s = x; s++) {
            y = Math.sqrt(y);
        }
        return y
    }
}

function multiply(y) {
    if (x === 0) {
        x = y
        return x
    }
    else {
        x *= y;
        return x
    }

}

function square(a) {
    circ = 4 * a;
    cont = a ** 2;
    return "Obvod = " + circ + " Obsah = " + cont
}

function rectangle(a, b) {
    circ = (2 * a) + (2 * b);
    cont = a * b;
    return "Obvod = " + circ + " Obsah = " + cont

}

function tria(a,b,c) {
    circ = parseFloat(a) + parseFloat(b) + parseFloat(c);
    cont = (a * b) / 2;
}

function triangle(a,b,c) {
    var mode = document.getElementById("mode");
    var mode = mode.options[mode.selectedIndex].value;
    if (mode === '1') {
        if (a === '' || b === '' || c === '') {
            return "Nesmie byť žiadne prázdne pole"
        }
        else {
            tria(a,b,c);
            return '<div class="table"><table style="width: 99%">' +
            '<tr><th>a</th><td>'+ a +'</td></tr>' +
            '<tr><th>b</th><td>'+ b +'</td></tr>' +
            '<tr><th>c</th><td>'+ c +'</td></tr>' +
            '<tr><th>Obvod</th><td>'+ circ +'</td></tr>' +
            '<tr><th>Obsah</th><td>'+ cont +'</td></tr>' +
            '</table></div>'
        }

    }
    else if (mode === '2') {
        if (a === '?') {
            a = (c ** 2) - (b ** 2);
            a = math.sqrt(a)
        }
        else if (b === '?') {
            b = (c ** 2) - (a ** 2);
            b = math.sqrt(b)
        }
        else if (c === '?') {
            c = (a ** 2) + (b ** 2);
            c = math.sqrt(c)
        }
        else if (r === '' || u === '' || i === '') {
            return 'Nesmie byť žiadne prázdne pole'
        }
        else {
            return 'Niečo nieje v poriadku'
        }
        tria(a,b,c);
        return '<div class="table"><table><tr><th>a</th><td>'+ a +'</td></tr>' +
        '<tr><th>b</th><td>'+ b +'</td></tr>' +
        '<tr><th>c</th><td>'+ c +'</td></tr>' +
        '<tr><th>Obvod</th><td>'+ circ +'</td></tr>' +
        '<tr><th>Obsah</th><td>'+ cont +'</td></tr>' +
        '</table></div>'
    }
}

function ohm(r, u, i, dcm=3) {
    if (r === '?') {
        r = u / i;
        r = osd(r, dcm);
    }
    else if (u === '?') {
        u = i * r;
        u = osd(u, dcm);
    }
    else if (i === '?') {
        i = u / r;
        i = osd(i, dcm)
    }
    else if (r === '' || u === '' || i === '') {
        return 'Nesmie byť žiadne prázdne polie'
    }
    else {
        return 'Niečo nieje v poriadku'
    }
    p = u * i;
    p = osd(p, dcm);
    return '<div class="table"><table style="width: 99%">' +
        '<tr><th>Odpor</th><td>'+ r +'Ω</td></tr>' +
        '<tr><th>Napätie</th><td>'+ u +'V</td></tr>' +
        '<tr><th>Prúd</th><td>'+ i +'A</td></tr>' +
        '<tr><th>Výkon</th><td>'+ p +'W</td></tr>' +
        '</table></div>'
}

function drop(d) {
document.getElementById(d).classList.toggle("show");
window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-menu");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}
}

function bmi(a, b) {
    b = parseFloat(b);
    a /= 100;
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
        //document.getElementById('rob').style.visibility = 'visible';
        op = 2;
    }

    else if (slct === 'mi')  {
        document.getElementById('mlt').innerHTML = ('');
        document.getElementById('fst').style.visibility = 'visible';
        document.getElementById('scnd').style.visibility = 'visible';
        //document.getElementById('rob').style.visibility = 'visible';
        op = 3;
    }

    else if (slct === 'ti') {
        document.getElementById('mlt').innerHTML = ('');
        document.getElementById('fst').style.visibility = 'visible';
        document.getElementById('scnd').style.visibility = 'hidden';
        //document.getElementById('rob').style.visibility = 'visible';
        op = 4;
    }

    else if (slct === 'di') {
        document.getElementById('mlt').innerHTML = ('');
        document.getElementById('fst').style.visibility = 'visible';
        document.getElementById('scnd').style.visibility = 'visible';
        //document.getElementById('rob').style.visibility = 'visible';
        op = 5;
    }

    else if (slct === 'po') {
        par = 6;
    }

    else if (slct === 'sq') {
        par = 7;
    }

    else if (slct === '') {
        document.getElementById('mlt').innerHTML = ('Vyber si operáciu');
        document.getElementById('fst').style.visibility = 'hidden';
        document.getElementById('scnd').style.visibility = 'hidden';
        //document.getElementById('rob').style.visibility = 'hidden';
        op = 1;
    }
}

function visin(act, prop) {
    $( "#" +  act ).click(function() {
        $( "#" +  prop ).toggle();
    });

}

function osd(dec, dcm=3) {
    if (dec < 0) {
        dec = dec.toFixed(dcm)
    }
    return dec
}

function olm() {
    var mode = document.getElementById("prc");
    var pr = mode.options[mode.selectedIndex].value;
    if (pr === 'po') {
        par = 6;
    }

    else if (pr === 'sq') {
        par = 7;
    }

}

function circ(r, d, o, s) {
    let h;
    if ((r !== '' && d !== '') || (o !== '' && s !== '') || (r !== '' && o !== '') || (d !== '' && s !== '') || (r !== '' && s !== '') || (d !== '' && o !== '')) {
        return 'Zadaj jeden údaj'
    }

    else if (r === '' && d === '' && s === '' && o === '') {
        return 'Zadaj aspoň jeden údaj'
    }

    else if (s !== '') {
        h = (s / 3.14);
        h = Math.sqrt(h);
        r = h;
        d = 2 * r;
    }

    else if (o !== '') {
        h = o / 3.14;
        d = h;
        r = d / 2;
    }

    else if (d !== '') {
        r = d / 2;
    }

    else if (r !== '') {
        d = 2 * r;
    }

    o = d * 3.14;
    s = 3.14 * (r ** 2);

    return '<div class="table"><table style="width: 99%">' +
        '<tr><th>Priemer</th><td>'+ d +'</td></tr>' +
        '<tr><th>Polomer</th><td>'+ r +'</td></tr>' +
        '<tr><th>Dĺžka</th><td>'+ o +'</td></tr>' +
        '<tr><th>Obsah</th><td>'+ s +'</td></tr>' +
        '</table></div>'
}

function sphere(r, d, s, v) {

    if ((r !== '' && d !== '') || (v !== '' && s !== '') || (r !== '' && v !== '') || (d !== '' && s !== '') || (r !== '' && s !== '') || (d !== '' && v !== '')) {
        return 'Zadaj jeden údaj'
    }

    else if (r === '' && d === '' && s === '' && v === '') {
        return 'Zadaj aspoň jeden údaj'
    }

    else if (d !== '') {
        r = d / 2;
    }

    else if (v !== '') {
        r = v / ((4/3) * 3.14);
        r = Math.sqrt(r);
        r = Math.sqrt(r);
        r = Math.sqrt(r);
    }

    else if (s !== '') {
        r = s / 4;
        r /= 3.14;
        r = Math.sqrt(r);
    }

    d = r * 2;
    v = ((4/3) * 3.14 * (r ** 3));
    s = (4 * 3.14 * (r ** 2));
    return '<div class="table"><table style="width: 99%">' +
        '<tr><th>Priemer</th><td>'+ d +'</td></tr>' +
        '<tr><th>Polomer</th><td>'+ r +'</td></tr>' +
        '<tr><th>Povrch</th><td>'+ s +'</td></tr>' +
        '<tr><th>Objem</th><td>'+ v +'</td></tr>' +
        '</table></div>'
}

$.get("calc.nav", function(data){
    $("#nav").replaceWith(data);
    });
