#!/usr/bin/python3

import os
from definitions import eoc
from colorama import init, Fore, Back, Style

#os .system("./resistor_circle.py")
print ("	")

tom = int(input(Fore.BLUE+'How many resistors? '+Fore.WHITE)) #tom = two or more resistors

rp = int(0)
rs = int(0)
x = int(0)
r = None
r1 = None
r2 = None

if tom == 2:
    while r1 is None or r1 is None:
        try:
            r1 = float( input("R1 = "))
            r2 = float( input("R2 = "))
            rp = rev_val(r1, r2)
            rs = (r1 + r2)
        except ValueError as verr:
            print(verr)
            r1 = None
            r2 = None
        except  TypeError as terr:
            print(terr)
            r1 = None
            r2 = None

elif tom > 2:
    while x != tom:
        x += 1
        try:
            print('')
            print(Fore.GREEN+"Enter R", x)
            r = float(input(Fore.WHITE +"Value:" ))
            rp += (1 / r)
            rs += r
        except ValueError as verr:
            print(verr)
            r = None
            x = None
        except  TypeError as terr:
            print(terr)
            r1 = None
            r2 = None

print ("	")
print("R  serial =", rs)
print('R paralel =', rp)
print ("	")

eoc()
