import { Finger, FingerCurl, GestureDescription } from 'fingerpose';

const openFistDescription = new GestureDescription('open_fist');

for (let finger of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
    openFistDescription.addCurl(finger, FingerCurl.NoCurl, 1.0);
    openFistDescription.addCurl(finger, FingerCurl.HalfCurl, 0.9);
}

export {openFistDescription};