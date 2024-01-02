import {TouchEvent, useState} from 'react';

interface SwipeInput {
    onSwipedLeft?: () => void;
    onSwipedRight?: () => void;
    onSwipedUp?: () => void;
    onSwipedDown?: () => void;
}

interface SwipeOutput {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: () => void;
}

export const useSwipeEvents = (input: SwipeInput): SwipeOutput => {
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
    const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e: TouchEvent) => {
        setTouchEnd(null); // Reset touchEnd
        setTouchStart({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        });
    };

    const onTouchMove = (e: TouchEvent) => {
        setTouchEnd({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        });
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const xDistance = touchStart.x - touchEnd.x;
        const yDistance = touchStart.y - touchEnd.y;

        const isLeftSwipe = xDistance > minSwipeDistance;
        const isRightSwipe = xDistance < -minSwipeDistance;
        const isUpSwipe = yDistance > minSwipeDistance;
        const isDownSwipe = yDistance < -minSwipeDistance;

        if (isLeftSwipe && input.onSwipedLeft) {
            input.onSwipedLeft();
        }
        if (isRightSwipe && input.onSwipedRight) {
            input.onSwipedRight();
        }
        if (isUpSwipe && input.onSwipedUp) {
            input.onSwipedUp();
        }
        if (isDownSwipe && input.onSwipedDown) {
            input.onSwipedDown();
        }
    };

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd
    };
};
