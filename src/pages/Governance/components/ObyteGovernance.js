import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { getObyteGovernanceParams } from "store/thunks";

export const ObyteGovernance = () => {
  const dispatch = useDispatch();
  
  useEffect(()=>{
    dispatch(getObyteGovernanceParams())
  }, [dispatch]);

  return <div>Obyte Governance</div>
}