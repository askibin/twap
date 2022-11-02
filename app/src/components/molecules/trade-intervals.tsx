import Box from "@mui/material/Box";
import Maybe from "easy-maybe/lib";
import { useCallback, useEffect, useReducer } from "react";

import intervalsReducer, {
  action,
  initialState,
} from "../../reducers/trade-intervals.reducer";
import TimeInterval from "../atoms/time-interval";

export type SelectedTif = [number | undefined, number | undefined];

export interface Props {
  indexedTifs: Voidable<IndexedTIF[]>;
  onSelect: (arg0: SelectedTif) => void;
  selectedTif?: SelectedTif;
}

export default ({ indexedTifs: tifs, onSelect, selectedTif }: Props) => {
  const indexedTifs = Maybe.of(tifs);

  // @ts-ignore
  const [state, dispatch] = useReducer(intervalsReducer, initialState);

  useEffect(() => {
    Maybe.andMap<IndexedTIF[], void>((data) => {
      // @ts-ignore
      dispatch(action.setTifs({ indexedTifs: data, selectedTif }));
    }, indexedTifs);

    return () => {};
  }, [indexedTifs, selectedTif]);

  const onScheduleSelect = useCallback(
    (value: number) => {
      // @ts-ignore
      dispatch(action.setSchedule({ tif: value }));

      Maybe.tap((itifs) => {
        onSelect([
          value !== -1
            ? itifs.find((itif) => itif.left === value)?.tif
            : undefined,
          value,
        ]);
      }, indexedTifs);
    },
    [dispatch, indexedTifs, onSelect]
  );

  const onPeriodSelect = useCallback(
    (value: number) => {
      // @ts-ignore
      dispatch(action.setPeriod({ tif: value }));

      onSelect([value, state.pairSelected[1]]);
    },
    [dispatch, onSelect, state.pairSelected]
  );

  const { pairSelected = [] } = state;

  return (
    <>
      <Box pb={2}>
        <TimeInterval
          info=""
          label="Schedule Order"
          values={state.scheduleTifs}
          value={pairSelected[1]}
          onSelect={onScheduleSelect}
        />
      </Box>
      <Box pb={2}>
        <TimeInterval
          info=""
          label="Execution Period"
          values={state.periodTifs}
          value={pairSelected[0]}
          onSelect={onPeriodSelect}
        />
      </Box>
    </>
  );
};
