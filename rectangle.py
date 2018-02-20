#!/usr/bin/python3

import os
from definitions import eoc

os .system("./banner_rectangle.py")
print ("	")

while True:
	a = input("Side a = ")
	b = input("Side b = ")
	try:
		circ = (float(a) * float(b))
		cont = ((float(a) + float(b))*2)
	except ValueError as verr:
		print(verr)
		continue
	break
print ("	")
print("Circuit =",circ)
print("Content =",cont)
print ("	")

eoc()
