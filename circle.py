#!/usr/bin/python3

import os
from definitions import eoc

os .system("./banner_circle.py")
print ("	")

r = None

while r == None:
	r = input("r = ")
	try:
		circ = (float(r) * 2 * 3.14159)
		cont = (float(r) * float(r) * 3.14159)
	except ValueError as verr:
		print(verr)
		r = None

print ("	")
print("Circuit =", circ)
print("Content =", cont)
print ("	")

eoc()
