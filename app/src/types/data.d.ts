declare type Voidable<T> = T | undefined;

declare type Action<Payload> = { type: string; payload: Payload };

declare type ActionPayload<Fn> = ReturnType<Fn>["payload"];

declare interface Actor<InPayload, OutPayload> {
  (arg0: string, arg1: InPayload): Action<OutPayload>;
}
