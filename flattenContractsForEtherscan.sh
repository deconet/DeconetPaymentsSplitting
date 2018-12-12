#!/bin/bash

mkdir -p flatContracts

rm -rf flatContracts/*

for filename in contracts/*.sol; do
    [ -e "$filename" ] || continue
    flat -input $filename -output flatContracts/$filename

done

# i have no idea why the heck flattener isn't flattening the ad-hoc splitter, but it isn't, so let's run it manually

flat -input contracts/DeconetAdHocPaymentsSplitting.sol -output flatContracts/contracts/DeconetAdHocPaymentsSplitting.sol