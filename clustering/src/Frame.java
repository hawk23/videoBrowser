import java.util.ArrayList;
import java.util.List;

/**
 * Created by veren_000 on 04.02.2016.
 */
public class Frame {
    private int seconds;
    private int secondsFrom;
    private int secondsTo;
    private String file;
    private Segment bottomSegment;

    public Segment getBottomSegment() {
        return bottomSegment;
    }

    public void setBottomSegment(Segment bottomSegment) {
        this.bottomSegment = bottomSegment;
    }

    public Frame(int seconds, String file) {
        this.seconds = seconds;
        this.file = file;
        bottomSegment = null;
        secondsFrom = seconds;
        secondsTo = seconds;
    }

    public Frame(int seconds, int secondsFrom, int secondsTo, String file) {
        this.seconds = seconds;
        this.file = file;
        bottomSegment = null;
        this.secondsFrom = secondsFrom;
        this.secondsTo = secondsTo;
    }


    public int getSeconds() {
        return seconds;
    }

    public void setSeconds(int seconds) {
        this.seconds = seconds;
    }

    public int getSecondsFrom() {
        return secondsFrom;
    }

    public void setSecondsFrom(int secondsFrom) {
        this.secondsFrom = secondsFrom;
    }

    public int getSecondsTo() {
        return secondsTo;
    }

    public void setSecondsTo(int secondsTo) {
        this.secondsTo = secondsTo;
    }

    public String getFile() {
        return file;
    }
}
