#!/usr/bin/python3

import os
from definitions import eoc

os.system("./banner_square.py")

while True:
	try:
		a = input("Side a = ")
		obv = float("4")*float(a)
		obs = float(a)*float(a)
		
	except ValueError as verr:
		print(verr)
		continue
	else:
		break
		
print ("	")
print ("	")
print ("Area =", obs)
print ("	")
print ("Perimeter =", obv)
print ("	")

eoc()
