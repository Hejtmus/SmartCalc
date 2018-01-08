#!/usr/bin/python3
# -*- coding: utf-8 -*-

import os
from colorama import init, Fore, Back, Style

os .system("python3 banner_basic_operations.py")

def eoc(): 	#eoc je end of calc
	import time
	while True:
		end = input("Done? [Y/n]")
		if end == "Y":
			print("ok")
			break
		elif end == "n":
			os .system("cd SmartCalc/")
			os .system("./menu.sh")


o = input("Operation? [+,-,*,/]")
if str(o) == "-":
    print(Fore.RED+("Difference u can do with summary of negative number"))
elif str(o) == "/":
	dividend = input("Enter dividend: ")
	denominator = input("Enter denominator: ")
	division = (float(dividend) / float(denominator))
	print(division)
	try:
		eoc()
	except NameError:
		print(" ")


print (Fore.BLUE+("Enter numbers, to end press Enter without inserting number")+Fore.WHITE)

total = 0
difference = 0
multiply = 1

count = 0

while True:
    line = input("Number:")
    if line:
        try:
            number = float(line)
        except ValueError as verr:

            print(Fore.RED+str(verr))
            print(Fore.WHITE)
            continue
        except TypeError as terr:
            print(Fore.RED+str(terr))
            print(Fore.WHITE)
            continue
            
        total += number
        count += 1
        multiply *= number

    else:
        break


if str(o) == "+":
	print("Summary is: ",total)
elif str(o) == "-":
	print("Difference is: ", total)
elif str(o) == "*":
    print("Multiply is: ", multiply)
elif str(o) == "/":
    print(float(division))
else:
    print("Invalid operation")

eoc()

