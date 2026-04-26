#!/bin/bash
KEY=$(grep MOLIT_API_KEY .env.local | cut -d= -f2)
echo "Testing key: ${KEY:0:12}..."

RESULT=$(curl -s "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev?serviceKey=$KEY&LAWD_CD=11680&DEAL_YMD=202503&numOfRows=3&pageNo=1")

if echo "$RESULT" | grep -q "Unauthorized"; then
  echo "❌ Not yet active — wait a few minutes and try again"
elif echo "$RESULT" | grep -q "아파트\|거래금액\|resultCode"; then
  echo "✅ API key is working! Real data is flowing."
else
  echo "⚠ Unexpected response:"
  echo "$RESULT" | head -c 400
fi
