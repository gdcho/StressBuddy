import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Avatar, Box, Typography, Paper } from "@mui/material";
import { North } from "@mui/icons-material";
import { useRouter } from "next/router";
import axios from "axios";
import createChatRoom from "@/utils/createChatRoom";
type UserProps = {
  name: string;
  strength: string;
  weakness: string;
};

type StudentPairProps = {
  user1: UserProps;
  user2: UserProps;
};

interface MatchInfo {
  userId: string;
  index1: number;
  index2: number;
  requestId: string;
}

function run(thisUser: any[], users: any, id: never) {
  type MatchResult = {
    combinedDifference: number;
    indices: [number, number];
    personIndex: number;
  };

  function findTop5BestMatches(
    matches: MatchResult[],
    userIdMap: { [index: number]: string },
    id: string
  ): MatchInfo {
    // Sort matches to get the one with the smallest combinedDifference first
    matches.sort((a, b) => a.combinedDifference - b.combinedDifference);
    const topMatch = matches[0];

    return {
      userId: userIdMap[topMatch.personIndex],
      index1: topMatch.indices[0],
      index2: topMatch.indices[1],
      requestId: id,
    };
  }

  function iterator(chosen: any[], person: any[]) {
    let maxPosDifference = Number.MIN_SAFE_INTEGER;
    let maxNegDifference = Number.MAX_SAFE_INTEGER;

    let index1 = -1;
    let index2 = -1;

    const chosenRatings = chosen[0].map((rating: string) =>
      parseInt(rating, 10)
    );
    const personRatings = person.map((rating) => parseInt(rating, 10));

    for (let i = 0; i < personRatings.length; i++) {
      // Calculate the difference between the chosen user's ratings and another user's ratings

      var diff = chosenRatings[i] - personRatings[i];

      if (diff > maxPosDifference) {
        maxPosDifference = diff;
        index1 = i;
      }
      // Check for a negative difference and store it if it's more negative than the current maxNegDifference
      if (diff < maxNegDifference) {
        maxNegDifference = diff;
        index2 = i;
      }
    }

    // Return an object with the combined differences and the indices of the largest positive and negative differences
    return {
      combinedDifference: maxPosDifference + Math.abs(maxNegDifference),
      indices: [index1, index2],
      personIndex: -1, // This should be set to the actual index of the person in the calling function
    };
  }

  function main(thisUser: any[], users: any[], id: string) {
    const chosen = thisUser;
    const people = users;

    const matches: MatchResult[] = [];
    const userIdMap = users.reduce((map, user, index) => {
      map[index] = user.userId;
      return map;
    }, {});
    people.forEach((person, index) => {
      const result: MatchResult = {
        combinedDifference: 0,
        indices: [0, 0],
        personIndex: 0,
      };
      const iteratorResult = iterator(chosen, people[index].userResults);
      result.combinedDifference = iteratorResult.combinedDifference;
      result.indices = [iteratorResult.indices[0], iteratorResult.indices[1]];
      result.personIndex = index;
      matches.push(result);
    });

    return findTop5BestMatches(matches, userIdMap, id);
  }

  return main(thisUser, users, id);
}

export default function Match() {
  const { data: session } = useSession();
  const [thisUser, setThisUser] = useState<string | null>(null);
  const [studentPair, setStudentPair] = useState<StudentPairProps | null>(null);
  const [matchedList, setMatchedList] = useState<any[]>([]);
  const [thisUserId, setThisUserId] = useState<string>("");
  const [thisUserName, setThisUserName] = useState<string>("");
  const [matchedUserName, setMatchedUserName] = useState<string>("");
  const [matchedUserId, setMatchedUserId] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    if (session && session.user && session.user.id) {
      const userId: string = session.user.id;
      setThisUser(userId);
    }
  }, [session]);

  useEffect(() => {
    const fetchData = async () => {
      if (!thisUser) return;

      try {
        const response = await fetch("/api/mongo");
        const jsonData = await response.json();

        const thisUserData = jsonData.find(
          (user: { user_id: any }) => user.user_id === thisUser
        );
        if (!thisUserData) {
          console.error("This user data not found");
        }

        const previouslyMatchedUserIds = Array.isArray(
          thisUserData.matched_user_id
        )
          ? thisUserData.matched_user_id
          : [];

        var otherUsers = jsonData.filter(
          (user: { user_id: any; term: any; option: any }) =>
            user.user_id !== thisUser &&
            user.term === thisUserData.term &&
            user.option === thisUserData.option &&
            !previouslyMatchedUserIds.includes(user.user_id)
        );
        if (otherUsers.length === 0) {
          alert("No users found!");
          return;
        }
        const thisUserResults = thisUserData.courses.map(
          (course: { rating: any }) => course.rating
        );
        const otherUsersResults = otherUsers.map(
          (user: { user_id: any; courses: any[] }) => ({
            userId: user.user_id,
            userResults: user.courses.map((course) => course.rating),
          })
        );

        const matchInfo = run(
          [thisUserResults],

          otherUsersResults,

          thisUser as never
        );

        var matchedUser = jsonData.find(
          (user: { user_id: string }) =>
            user.user_id === matchInfo.userId.toString()
        );
        var urself = jsonData.find(
          (user: { user_id: any }) => user.user_id === thisUser
        );
        var strengthx = matchedUser.courses[matchInfo.index1].courseName;
        var weaknessx = matchedUser.courses[matchInfo.index2].courseName;
        var user1Name = matchedUser.name;
        var user2Name = urself.name;

        const user1Props: UserProps = {
          name: user2Name,
          strength: strengthx,
          weakness: weaknessx,
        };

        const user2Props: UserProps = {
          name: user1Name,
          strength: weaknessx,
          weakness: strengthx,
        };

        const studentPair: StudentPairProps = {
          user1: user1Props,
          user2: user2Props,
        };
        setStudentPair({
          user1: { name: user2Name, strength: strengthx, weakness: weaknessx },
          user2: { name: user1Name, strength: weaknessx, weakness: strengthx },
        });
        if (!thisUserData) {
          console.error("This user data not found");
          return;
        }

        // Initialize matched_user_id as an array if it's not already
        const existingMatches = Array.isArray(thisUserData.matched_user_id)
          ? thisUserData.matched_user_id
          : [];

        const matchedUserInfo = {
          user_id: thisUserData.user_id,
          matched_user_id: [...existingMatches, matchInfo.userId],
        };
        setThisUserId(matchInfo.userId);
        setMatchedUserId(matchInfo.requestId);
        setThisUserName(user1Props.name);
        setMatchedUserName(user2Props.name);

        try {
          await axios.post("/api/updateMatch", matchedUserInfo);
          // console.log("User data updated successfully");
        } catch (error) {
          console.error("Error updating user data:", error);
        }

        // Update the local matchedList state to include the new match
        setMatchedList((currentMatchedList) => {
          // Create a new set to avoid duplicate user IDs
          const newSet = new Set(currentMatchedList.map((item) => item.id));
          // Add the new user ID
          newSet.add(matchInfo.userId);
          // Convert the set back to an array
          return Array.from(newSet).map((id) => ({ id }));
        });
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchData();
  }, [thisUser]);

  const user_id = session?.user?.id || "";
  const userName = session?.user?.name || "";
  const userToken = session?.user?.token || "";

  function chatRoom() {
    createChatRoom(
      user_id,
      userName,
      userToken,
      thisUserId,
      matchedUserId,
      thisUserName,
      matchedUserName
    );
    router.push("/connect");
  }

  // createChatRoom("117082830115624728877", "106315073484519680643");

  return (
    <Box className="flex flex-col items-center justify-center p-10">
      {/* User 2 */}
      <Typography variant="h6">{studentPair?.user2.name}</Typography>
      <Avatar
        src="/image/avatar.png"
        alt="User Avatar"
        style={{ width: 100, height: 100 }}
        className="mb-4 mt-2"
      />
      <Box className="flex justify-between items-center w-full">
        <Paper className="bg-red-500 text-white px-4 py-2 rounded-full">
          <Typography>{studentPair?.user2.weakness}</Typography>
        </Paper>
        <Paper className="bg-green-500 text-white px-4 py-2 rounded-full">
          <Typography>{studentPair?.user2.strength}</Typography>
        </Paper>
      </Box>
      {/* Arrows */}
      <Box className="flex justify-between items-center w-full my-8">
        <North className="text-6xl my-8 transform scale-125" />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-full text-2xl cursor-pointer"
          onClick={() => chatRoom()}
        >
          Chat
        </button>
        <North className="text-6xl my-8 transform rotate-180 scale-125" />
      </Box>
      {/* User 1 */}
      <Typography variant="h6">{studentPair?.user1.name}</Typography>
      <Avatar
        src="/image/avatar.png"
        alt="User Avatar"
        style={{ width: 100, height: 100 }}
        className="mb-4 mt-2"
      />
      <Box className="flex justify-between items-center w-full">
        <Paper className="bg-green-500 text-white px-4 py-2 rounded-full">
          <Typography>{studentPair?.user1.strength}</Typography>
        </Paper>
        <Paper className="bg-red-500 text-white px-4 py-2 rounded-full">
          <Typography>{studentPair?.user1.weakness}</Typography>
        </Paper>
      </Box>
    </Box>
  );
}
