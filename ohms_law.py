#!/usr/bin/python3

import os
from definitions import eoc

os .system("./banner_ohms_law.py")
print ("	")

print ("			")
print ("""If value is unknown, type "?" """)
print ("			")		

while True:
	try:
		R = input("Resistence = ")
		U = input("Voltage = ")
		I = input("Current = ")
		print(" ")
		if R == "?":
			R = float(U)/float(I)
			print("Resistence is:",  R ,"Ω")
		elif U =="?":
			U = float(R)*float(I)
			print("Voltage is:", U ,"V")
		elif I =="?":
			I = float(U)/float(R)
			print("Current is:", I ,"A")
		P = float(U)*float(I)
		print("Perfomance is:",P,"W")
	except ValueError as verr:
            print(verr)
            continue
	break

eoc()
