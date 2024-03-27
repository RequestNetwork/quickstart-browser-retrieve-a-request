"use client";

import { currencies } from "@/config/currency";
import { RequestNetwork, Types } from "@requestnetwork/request-client.js";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";

// EDIT THIS TO SELECT THE USER'S ADDRESS
const userAddress = "0x519145B771a6e450461af89980e5C17Ff6Fd8A92";

export default function Home() {
  const [requests, setRequests] =
    useState<(Types.IRequestDataWithEvents | undefined)[]>();

  useEffect(() => {
    const fetchRequests = async () => {
      const requestClient = new RequestNetwork({
        nodeConnectionConfig: {
          baseURL: "https://sepolia.gateway.request.network/",
        },
      });

      try {
        const requests = await requestClient.fromIdentity({
          type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
          value: userAddress,
        });

        setRequests(requests.map((request) => request.getData()));
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      }
    };

    fetchRequests();
  }, []);

  return (
    <div className="App">
      <h1>Retrieve a user&apos;s requests </h1>
      <p>
        <b>User:</b> {userAddress}
      </p>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Request ID</th>
            <th>Payer</th>
            <th>Currency</th>
            <th>Expected Amount</th>
            <th>Reason</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {requests?.map((request) => (
            <tr key={request?.timestamp}>
              <td>{request?.timestamp}</td>
              <td>
                {request?.requestId.slice(0, 4)}...
                {request?.requestId.slice(62, 66)}
              </td>
              <td>
                {request?.payer?.value.slice(0, 5)}...
                {request?.payer?.value.slice(39, 42)}
              </td>
              <td>
                {
                  currencies.get(
                    request!.currencyInfo.network!.concat(
                      "_",
                      request!.currencyInfo.value,
                    ),
                  )?.symbol
                }
              </td>
              <td>
                {formatUnits(
                  BigInt(request?.expectedAmount as number),
                  currencies.get(
                    request!.currencyInfo.network!.concat(
                      "_",
                      request!.currencyInfo.value,
                    ),
                  )?.decimals || 18,
                )}
              </td>
              <td>{request?.contentData.reason}</td>
              <td>{request?.contentData.dueDate}</td>
              <td>
                {calculateStatus(
                  request?.state as string,
                  BigInt(request?.expectedAmount as number),
                  BigInt(request?.balance?.balance || 0),
                )}
              </td>
              <td>{formatUnits(BigInt(request?.balance?.balance || 0), 18)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h1>Raw Requests</h1>
      <ul>
        {requests?.map((request) => (
          <li key={request?.requestId}>
            <pre>{JSON.stringify(request, undefined, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}

const calculateStatus = (
  state: string,
  expectedAmount: bigint,
  balance: bigint,
) => {
  if (balance >= expectedAmount) {
    return "Paid";
  }
  if (state === Types.RequestLogic.STATE.ACCEPTED) {
    return "Accepted";
  } else if (state === Types.RequestLogic.STATE.CANCELED) {
    return "Canceled";
  } else if (state === Types.RequestLogic.STATE.CREATED) {
    return "Created";
  } else if (state === Types.RequestLogic.STATE.PENDING) {
    return "Pending";
  }
};
