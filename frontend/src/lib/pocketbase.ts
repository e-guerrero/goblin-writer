import PocketBase from "pocketbase";

const url = "https://www.goblinwriter.com";
export const pb = new PocketBase(url);
// const pb = new PocketBase(url);
// export default pb;
pb.autoCancellation(false); // gets rid of console error
