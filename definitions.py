#!/usr/bin/python3

import os

def eoc(): 	#eoc je end of calc
    end = None
    while end is None:
        end = input("Done? [Y/n]")
        if end == "Y" or end == "y":
            print("ok")
        elif end == "n" or end == "N":
            os.system("cd SmartCalc")
            os.system("./menu")

def int_inpt(x):
    while True:
        try:
            n = int(input(x))
            return n
        except ValueError as verr:
            print(verr)

def rev_val(x, y):
    while True:
        try:
            z = (x * y) / (x + y)
        except ValueError as verr:
            print(verr)
            continue