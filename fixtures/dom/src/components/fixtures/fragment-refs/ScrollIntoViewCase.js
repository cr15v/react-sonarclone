import TestCase from '../../TestCase';
import Fixture from '../../Fixture';

const React = window.React;
const {Fragment, useRef, useState, useEffect} = React;
const ReactDOM = window.ReactDOM;

function Controls({
  alignToTop,
  setAlignToTop,
  scrollVertical,
  scrollVerticalNoChildren,
}) {
  return (
    <div>
      <label>
        Align to Top:
        <input
          type="checkbox"
          checked={alignToTop}
          onChange={e => setAlignToTop(e.target.checked)}
        />
      </label>
      <div>
        <button onClick={scrollVertical}>scrollIntoView() - Vertical</button>
        <button onClick={scrollVerticalNoChildren}>
          scrollIntoView() - Vertical, No children
        </button>
      </div>
    </div>
  );
}

function TargetElement({color, top, id}) {
  return (
    <div
      id={id}
      style={{
        height: 500,
        backgroundColor: color,
        marginTop: top ? '50vh' : 0,
        marginBottom: 100,
        flexShrink: 0,
      }}>
      {id}
    </div>
  );
}

export default function ScrollIntoViewCase() {
  const [alignToTop, setAlignToTop] = useState(true);
  const [displayFixedElements, setDisplayFixedElements] = useState(false);
  const [didMount, setDidMount] = useState(false);
  const verticalRef = useRef(null);
  const noChildRef = useRef(null);
  const testCaseRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const scrollVertical = () => {
    verticalRef.current.scrollIntoView(alignToTop);
  };

  const scrollVerticalNoChildren = () => {
    noChildRef.current.scrollIntoView(alignToTop);
  };

  // Hack to portal child into the scroll container
  // after the first render. This is to simulate a case where
  // an item is portaled into another scroll container.
  useEffect(() => {
    if (!didMount) {
      setDidMount(true);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setDisplayFixedElements(true);
        } else {
          setDisplayFixedElements(false);
        }
      });
    });
    testCaseRef.current.observeUsing(observer);

    const lastRef = testCaseRef.current;
    return () => {
      lastRef.unobserveUsing(observer);
      observer.disconnect();
    };
  });

  return (
    <Fragment ref={testCaseRef}>
      <TestCase title="ScrollIntoView">
        <TestCase.Steps>
          <li>Toggle alignToTop and click the buttons to scroll</li>
        </TestCase.Steps>
        <TestCase.ExpectedResult>
          <p>When the Fragment has children:</p>
          <p>
            The simple path is that all children are in the same scroll
            container. If alignToTop=true|undefined, we will select the first
            Fragment host child to call scrollIntoView on. Otherwise we'll call
            on the last host child.
          </p>
          <p>
            In the case of fixed elements and inserted elements or portals
            causing fragment siblings to be in different scroll containers, we
            split up the host children into groups of scroll containers. If we
            hit a fixed element, we'll always attempt to scroll on the first or
            last element of the next group.
          </p>
          <p>When the Fragment does not have children:</p>
          <p>
            The Fragment still represents a virtual space. We can scroll to the
            nearest edge by selecting the host sibling before if
            alignToTop=false, or after if alignToTop=true|undefined. We'll fall
            back to the other sibling or parent in the case that the preferred
            sibling target doesn't exist.
          </p>
        </TestCase.ExpectedResult>
        <Fixture>
          <Fixture.Controls>
            <Controls
              alignToTop={alignToTop}
              setAlignToTop={setAlignToTop}
              scrollVertical={scrollVertical}
              scrollVerticalNoChildren={scrollVerticalNoChildren}
            />
          </Fixture.Controls>
          <div
            style={{
              height: '50vh',
              overflowY: 'auto',
              border: '1px solid black',
              marginBottom: '1rem',
            }}
            ref={scrollContainerRef}>
            <TargetElement color="lightyellow" id="SCROLLABLE-1" />
            <TargetElement color="lightpink" id="SCROLLABLE-2" />
            <TargetElement color="lightcyan" id="SCROLLABLE-3" />
          </div>
          <Fragment ref={verticalRef}>
            {displayFixedElements && (
              <div
                style={{position: 'fixed', top: 0, backgroundColor: 'red'}}
                id="header">
                Fixed header
              </div>
            )}
            {didMount &&
              ReactDOM.createPortal(
                <TargetElement color="red" id="SCROLLABLE-4" />,
                scrollContainerRef.current
              )}
            <TargetElement color="lightgreen" top={true} id="A" />
            <Fragment ref={noChildRef}></Fragment>
            <TargetElement color="lightcoral" id="B" />
            <TargetElement color="lightblue" id="C" />
            {displayFixedElements && (
              <div
                style={{
                  position: 'fixed',
                  bottom: 0,
                  backgroundColor: 'purple',
                }}
                id="footer">
                Fixed footer
              </div>
            )}
          </Fragment>
          <Fixture.Controls>
            <Controls
              alignToTop={alignToTop}
              setAlignToTop={setAlignToTop}
              scrollVertical={scrollVertical}
              scrollVerticalNoChildren={scrollVerticalNoChildren}
            />
          </Fixture.Controls>
        </Fixture>
      </TestCase>
    </Fragment>
  );
}
