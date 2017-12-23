#!/usr/bin/python3

import os
os .system("./banner_triangle.py")

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

