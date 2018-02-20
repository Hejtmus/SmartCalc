#!/usr/bin/python3

import os
from definitions import eoc

os .system("./banner_triangle.py")

while True:
	try:
		a = input("Side a = ")
		b = input("Side b = ")
		c = input("Side c (hypotenuse) = ")	#hypotenuse je prepona

		circ = (float(a) + float(b) + float(c))
		cont = (float(a) * float(b) / 2)
	except ValueError as verr:
		print(verr)
		continue
	break

print ("	")
print ("	")
print("Circuit =", circ)
print ("	")
print("Content =", cont)
print ("	")

eoc()

