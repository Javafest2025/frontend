import { renderHook, act } from "@testing-library/react";
import { useToast, toast, reducer, testApi } from "@/hooks/use-toast";

describe("useToast", () => {
    // Reset state before each test
    beforeEach(() => {
        act(() => {
            testApi.dispatch({ type: "REMOVE_TOAST" });
        })
    });

    it("should add a toast", () => {
        const { result } = renderHook(() => useToast());

        act(() => {
            toast({ title: "Test Toast" });
        });

        expect(result.current.toasts).toHaveLength(1);
        expect(result.current.toasts[0].title).toBe("Test Toast");
    });

    it("should dismiss a toast", () => {
        const { result } = renderHook(() => useToast());
        let toastId: string | undefined;

        act(() => {
            const { id } = toast({ title: "Test Toast" });
            toastId = id;
        });

        expect(result.current.toasts).toHaveLength(1);

        act(() => {
            result.current.dismiss(toastId);
        });

        // In the implementation, dismiss sets `open` to false, it does not remove the toast immediately
        expect(result.current.toasts[0].open).toBe(false);
    });

    it('should update a toast', () => {
        const { result } = renderHook(() => useToast());

        let toastControls: { id: string; update: (props: any) => void; };
        act(() => {
            toastControls = toast({ title: 'Initial Title' });
        });

        expect(result.current.toasts[0].title).toBe('Initial Title');

        act(() => {
            toastControls.update({ title: 'Updated Title' });
        });

        expect(result.current.toasts[0].title).toBe('Updated Title');
    });
});

describe('toast reducer', () => {
    it('should add a toast', () => {
        const initialState = { toasts: [] };
        const newToast = { id: '1', title: 'Test', open: true, onOpenChange: () => { } };
        const action = { type: 'ADD_TOAST' as const, toast: newToast };
        const newState = reducer(initialState, action);
        expect(newState.toasts).toHaveLength(1);
        expect(newState.toasts[0]).toEqual(newToast);
    });

    it('should dismiss a toast', () => {
        const initialToast = { id: '1', title: 'Test', open: true, onOpenChange: () => { } };
        const initialState = { toasts: [initialToast] };
        const action = { type: 'DISMISS_TOAST' as const, toastId: '1' };
        const newState = reducer(initialState, action);
        expect(newState.toasts[0].open).toBe(false);
    });

    it('should update a toast', () => {
        const initialToast = { id: '1', title: 'Initial', open: true, onOpenChange: () => { } };
        const initialState = { toasts: [initialToast] };
        const action = { type: 'UPDATE_TOAST' as const, toast: { id: '1', title: 'Updated' } };
        const newState = reducer(initialState, action);
        expect(newState.toasts[0].title).toBe('Updated');
    });

    it('should remove a toast', () => {
        const toast1 = { id: '1', title: 'Toast 1', open: false, onOpenChange: () => { } };
        const toast2 = { id: '2', title: 'Toast 2', open: true, onOpenChange: () => { } };
        const initialState = { toasts: [toast1, toast2] };
        const action = { type: 'REMOVE_TOAST' as const, toastId: '1' };
        const newState = reducer(initialState, action);
        expect(newState.toasts).toHaveLength(1);
        expect(newState.toasts[0].id).toBe('2');
    });
}); 