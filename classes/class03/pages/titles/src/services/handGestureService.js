import { knownGestures, gestureStrings } from "../util/util.js";


export default class HandGestureService {
    #gestureEstimator
    #handPoseDetection
    #handsVersion
    #detector = null;
    #gestureStrings

    constructor({ fingerpose, handPoseDetection, handsVersion, gestureStrings }) {
        this.#gestureEstimator = new fingerpose.GestureEstimator(knownGestures)
        this.#handPoseDetection = handPoseDetection
        this.#handsVersion = handsVersion
        this.#gestureStrings = gestureStrings
    }


    async initializeDetector() {
        if (this.#detector) return this.#detector
        // const model = this.#handPoseDetection.SupportedModels.MediaPipeHands;
        const detectorConfig = {
            runtime: 'mediapipe', // or 'tfjs',
            solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${this.#handsVersion}`,
            //Full é o mais pesado e o mais preciso
            modelType: 'lite',
            maxHands: 2,
        }
        this.#detector = await this.#handPoseDetection.createDetector(
            this.#handPoseDetection.SupportedModels.MediaPipeHands,
            detectorConfig
        )

        return this.#detector;
    }

    async estimateHands(video) {
        return this.#detector.estimateHands(video, {
            flipHorizontal: true
        })
    }

    async * detectGestures(predictions) {
        for (const hand of predictions) {
            if (!hand.keypoints3D) continue
            const gestures = await this.estimate(hand.keypoints3D)
            if (!gestures.length) continue
            const result = gestures.reduce(
                (previous, current) => (previous.score > current.score) ? previous : current
            )
            const { x, y } = hand.keypoints.find(keypoint => keypoint.name === 'index_finger_tip')
            yield { event: result.name, x, y}
            
            console.log('detected', this.#gestureStrings[result.name])
        }
    }

    async estimate(keypoints3D) {
        const predictions = await this.#gestureEstimator.estimate(
            this.#getLandMarksFromKeypoints(keypoints3D),
            // porcentagem de confiança do gesto (90%)
            9
        )
        return predictions.gestures
    }

    #getLandMarksFromKeypoints(keypoints3D) {
        return keypoints3D.map(keypoint =>
            [keypoint.x, keypoint.y, keypoint.z]
        )
    }


}