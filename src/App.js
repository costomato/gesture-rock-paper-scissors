import React, { useEffect, useRef, useState } from "react";
// eslint-disable-next-line
import * as _ from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import Webcam from "react-webcam";
import { drawHand } from "./utils/drawHand";

import * as fp from "fingerpose";
import { fistDescription } from "./gestures/Fist";
import { openFistDescription } from "./gestures/OpenFist";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [gestureName, setGestureName] = useState(null);

  let GE;
  let net;

  const init = async () => {
    GE = new fp.GestureEstimator([
      fp.Gestures.VictoryGesture,
      fistDescription,
      openFistDescription
    ]);

    net = await handpose.load();
    console.log("Handpose model loaded.");
  }

  const predictGesture = async () => {
    setTimeout(async () => {
      if (
        typeof webcamRef.current !== "undefined" &&
        webcamRef.current !== null &&
        webcamRef.current.video.readyState === 4
      ) {
        // Get Video Properties
        const video = webcamRef.current.video;
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        // Set video width
        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        // Set canvas height and width
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        // Make Detections
        const hand = await net.estimateHands(video, true);

        // Draw mesh
        const context = canvasRef.current.getContext("2d");
        drawHand(hand, context);

        if (hand.length > 0) {

          const gesture = await GE.estimate(hand[0].landmarks, 8);
          // console.log(gesture);

          if (gesture.gestures !== undefined && gesture.gestures.length > 0) {
            const confidence = gesture.gestures.map(
              (prediction) => prediction.score
            );
            const maxConfidence = confidence.indexOf(
              Math.max.apply(null, confidence)
            );
            setGestureName(gesture.gestures[maxConfidence].name);
            let rpsGesture = "";
            switch (gesture.gestures[maxConfidence].name) {
              case "fist":
                rpsGesture = "rock";
                break;
              case "open_fist":
                rpsGesture = "paper";
                break;
              case "victory":
                rpsGesture = "scissors";
                break;
              default:
                rpsGesture = "none";
            }
            console.log(rpsGesture)
            handleClick(rpsGesture)
          }
        } else {
          predictGesture()
        }
      }
    }, 0);
  };

  init().then(() => {
    predictGesture();
  })


  // The game logic

  const [rounds, setRounds] = useState(5);
  const [disabled, setDisabled] = useState(false);
  const [roundResult, setRoundResult] = useState("");

  // let numberOfRounds = 0;
  const [numberOfRounds, setNumberOfRounds] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);

  // user choice and computer chocie
  const [userChoice, setUserChoice] = useState("");
  const [computerChoice, setComputerChoice] = useState("");

  const handleInput = (event) => {
    setRounds(event.target.value);
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    // numberOfRounds = rounds;
    setNumberOfRounds(rounds);
    setDisabled(true);
  }

  // let userScore = 0;
  // let computerScore = 0;
  const [userScore, setUserScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const choices = ["rock", "paper", "scissors"];

  const generateChoice = () => {
    const rChoice = choices[Math.floor(Math.random() * choices.length)]
    setComputerChoice(rChoice);
  }

  const handleClick = (value) => {
    if (currentRound <= numberOfRounds) {
      setUserChoice(value);
      generateChoice()
    }
  }


  useEffect(() => {
    if (numberOfRounds > currentRound && userChoice && computerChoice) {
      setCurrentRound(currentRound + 1)
    }
  }, [computerChoice, userChoice])

  useEffect(() => {
    if (numberOfRounds >= currentRound && userChoice && computerChoice) {
      switch (userChoice + computerChoice) {
        case "rockscissors":
        case "paperrock":
        case "scissorspaper":
          setUserScore(userScore + 1);
          setRoundResult(`${roundResult}Round ${currentRound}: You win! ${userChoice} beats ${computerChoice}\n`);
          break;
        case "rockpaper":
        case "paperscissors":
        case "scissorsrock":
          setComputerScore(computerScore + 1);
          setRoundResult(`${roundResult}Round ${currentRound}: You lose! ${computerChoice} beats ${userChoice}\n`);
          break;
        default:
          setRoundResult(`${roundResult}Round ${currentRound}: It's a tie! ${computerChoice} and ${userChoice}\n`);
      }
      if (currentRound === numberOfRounds) {
        if (userScore > computerScore) {
          setRoundResult(`${roundResult} Congratulations! You won the game with a score of ${userScore}-${computerScore}`)
        } else if (userScore < computerScore) {
          setRoundResult(`${roundResult} Sorry, You lost the game with a score of ${userScore}-${computerScore}`)
        } else {
          setRoundResult(`${roundResult} The game was a tie with a score of ${userScore}-${computerScore}`)
        }
      }
      setUserChoice("");
      setComputerChoice("");
    }
  }, [currentRound])

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <p>Number of rounds: <input disabled={disabled} type="number" min="1" value={rounds} onChange={handleInput} required /> <button disabled={disabled} type="submit">Set</button>
        </p>
      </form>
      <p>Your choice: {choices.map((choice, index) => <button key={index} onClick={() => handleClick(choice)}>{choice}</button>)}
      </p>
      <p style={{ whiteSpace: "pre-line" }}>{roundResult}</p>


      <div>
        {gestureName !== null ? <h1>Your gesture: {gestureName}</h1> : ""}
      </div>

      <Webcam
        ref={webcamRef}
        mirrored={true}
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          textAlign: "center",
          zindex: 9,
          width: 640,
          height: 480,
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          textAlign: "center",
          zindex: 9,
          width: 640,
          height: 480,
        }}
      />
    </div>
  );
}

export default App;
